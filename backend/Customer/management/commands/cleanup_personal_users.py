import logging
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from Customer.models import Customer, OTPVerification, AuthAuditLog, Subscriber, CustomerAddress
from Customer.keycloak import delete_keycloak_user

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Delete all personal users from Django and Keycloak. Keeps business users intact."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Actually perform deletion (default is dry-run / report only)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Skip confirmation prompt before deletion",
        )

    def handle(self, *args, **options):
        execute = options["execute"]
        force = options["force"]

        all_users = Customer.objects.all().order_by("id")

        if not all_users.exists():
            self.stdout.write(self.style.WARNING("No users found in database."))
            return

        business_users = all_users.filter(account_type="business")
        personal_users = all_users.filter(account_type="personal")

        self.generate_report(business_users, personal_users)

        if not execute:
            self.stdout.write(
                self.style.WARNING("\nDRY-RUN: No changes were made.")
            )
            self.stdout.write(
                self.style.NOTICE(
                    "Run with --execute to perform deletion."
                )
            )
            return

        if not force:
            confirm = input(
                f"\nAre you sure you want to delete {personal_users.count()} personal users? (yes/no): "
            )
            if confirm.strip().lower() not in ("yes", "y"):
                self.stdout.write(self.style.WARNING("Deletion cancelled."))
                return

        self.execute_cleanup(personal_users, business_users)

    def generate_report(self, business_users, personal_users):
        self.stdout.write(self.style.MEGAHEADER("USER CLEANUP REPORT"))
        self.stdout.write("=" * 120)
        self.stdout.write(
            f"{'ID':<5} {'Email':<35} {'Username':<20} {'Account Type':<15} {'Status':<25} {'Keycloak ID':<40}"
        )
        self.stdout.write("-" * 120)

        for user in business_users:
            self.stdout.write(
                f"{user.id:<5} {user.email:<35} {user.username:<20} "
                f"{user.account_type:<15} {user.user_status:<25} "
                f"{(user.keycloak_user_id or 'N/A'):<40}"
            )

        for user in personal_users:
            self.stdout.write(
                f"{user.id:<5} {user.email:<35} {user.username:<20} "
                f"{user.account_type:<15} {user.user_status:<25} "
                f"{(user.keycloak_user_id or 'N/A'):<40}"
            )

        self.stdout.write("=" * 120)
        self.stdout.write(
            self.style.SUCCESS(
                f"\nKEEP:   {business_users.count()} business user(s)"
            )
        )
        self.stdout.write(
            self.style.ERROR(
                f"DELETE: {personal_users.count()} personal user(s)"
            )
        )

    def execute_cleanup(self, personal_users, business_users):
        deleted_keycloak = 0
        deleted_django = 0
        skipped = 0
        errors = []

        for user in personal_users:
            self.stdout.write(
                f"\nProcessing: {user.email} (id={user.id})"
            )

            if user.keycloak_user_id:
                try:
                    delete_keycloak_user(user.keycloak_user_id)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  [OK] Deleted from Keycloak: {user.keycloak_user_id}"
                        )
                    )
                    deleted_keycloak += 1
                except Exception as e:
                    msg = (
                        f"Keycloak deletion failed for {user.email} "
                        f"(keycloak_id={user.keycloak_user_id}): {e}"
                    )
                    self.stdout.write(self.style.ERROR(f"  [FAIL] {msg}"))
                    logger.error(msg)
                    errors.append(msg)
                    skipped += 1
                    continue
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"  [SKIP] No keycloak_user_id for {user.email}"
                    )
                )

            with transaction.atomic():
                user_id = user.id
                user_email = user.email

                OTPVerification.objects.filter(user_id=user_id).delete()
                AuthAuditLog.objects.filter(user_id=user_id).delete()
                CustomerAddress.objects.filter(custId__username=user.username).delete()
                Subscriber.objects.filter(email=user_email).delete()

                user.delete()

                deleted_django += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [OK] Deleted from Django: {user_email}"
                    )
                )

        self.stdout.write(
            self.style.MEGAHEADER("\n\nFINAL CLEANUP REPORT")
        )
        self.stdout.write("=" * 60)
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted from Keycloak: {deleted_keycloak} user(s)"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted from Django:   {deleted_django} user(s)"
            )
        )
        if skipped > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped (Keycloak failure): {skipped} user(s)"
                )
            )
        remaining_business = Customer.objects.filter(
            account_type="business"
        ).count()
        remaining_profiles = self._count_seller_profiles()
        self.stdout.write(
            self.style.SUCCESS(
                f"Remaining business users: {remaining_business} user(s)"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Remaining seller profiles: {remaining_profiles} profile(s)"
            )
        )
        no_biz_modified = (
            self._business_records_untouched(business_users)
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"No business records modified: {no_biz_modified}"
            )
        )

        if errors:
            self.stdout.write(
                self.style.WARNING(
                    f"\nErrors encountered ({len(errors)}):"
                )
            )
            for err in errors:
                self.stdout.write(self.style.WARNING(f"  - {err}"))

    def _count_seller_profiles(self):
        try:
            from Seller.models import SellerProfile
            return SellerProfile.objects.count()
        except Exception:
            return "N/A"

    def _business_records_untouched(self, business_users_before):
        try:
            current_business = Customer.objects.filter(
                account_type="business"
            )
            if current_business.count() != business_users_before.count():
                return False
            for b in business_users_before:
                if not current_business.filter(id=b.id).exists():
                    return False
            return True
        except Exception:
            return "CHECK MANUALLY"
