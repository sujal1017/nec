from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from django.utils import timezone
from Customer.models import Customer
from django.core.exceptions import ValidationError

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, blank=True, db_index=True)
    image = models.FileField(upload_to="categories/", blank=True, null=True)

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        if not self.slug:
            self.slug = slugify(self.name)[:120] or "category"
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Seller(models.Model):
    name = models.CharField(max_length=150)
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    return_policy = models.CharField(max_length=255)
    warranty = models.CharField(max_length=255)
    total_sales = models.PositiveIntegerField(null=True, blank=True)
    joined_date = models.DateField(null=True, blank=True)
    verified = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    business_hours = models.CharField(max_length=100, null=True, blank=True)
    shipping_time = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    badges = models.JSONField(default=list)
   

    def __str__(self):
        return self.name
    
class CustomerSupport(models.Model):
    seller = models.OneToOneField(Seller, on_delete=models.CASCADE, related_name='customer_support')
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    response_time = models.CharField(max_length=100)

    def __str__(self):
        return self.seller.name

class ProductOption(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class OptionValue(models.Model):
    option = models.ForeignKey(ProductOption, on_delete=models.CASCADE, related_name='values')
    value = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.option.name}: {self.value}"

    class Meta:
        unique_together = ('option', 'value')


class Product(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_ARCHIVED, "Archived"),
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, blank=True, db_index=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    stock = models.PositiveIntegerField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, related_name='products')
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='products')
    seller_profile = models.ForeignKey(
        "Seller.SellerProfile",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="products",
    )
    sku = models.CharField(max_length=80, blank=True, db_index=True)
    image = models.URLField(blank=True, null=True)
    thumbnail = models.FileField(upload_to="products/thumbnails/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    is_featured = models.BooleanField(default=False)
    options = models.ManyToManyField(OptionValue, default=dict, blank=True)
    features = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def stock_quantity(self):
        return self.stock

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)[:240] or "product"
            slug = base_slug
            counter = 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                suffix = f"-{counter}"
                slug = f"{base_slug[: 280 - len(suffix)]}{suffix}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.FileField(upload_to="products/", blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    is_main = models.BooleanField(default=False)
    option = models.ForeignKey(OptionValue, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Image for {self.product.name}"
    
    def clean(self):
        if self.option:
            is_valid_option = self.product.options.filter(pk=self.option.pk).exists()
            if not is_valid_option:
                raise ValidationError({
                    'option': f"The option '{self.option}' is not valid for the product '{self.product.name}'."
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    date = models.DateField()
    title = models.CharField(max_length=200)
    comment = models.TextField()

    @property
    def username(self):
        return self.user.username
    
    def __str__(self):
        return f"Review by {self.username} for {self.product.name}"

class FAQ(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='faqs')
    question = models.TextField()
    answer = models.TextField()

    def __str__(self):
        return f"{self.product.name}: {self.question}"

    
class Banner(models.Model):
    image = models.FileField(upload_to="banners/", blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    alt = models.CharField(max_length=100)
    title = models.CharField(max_length=160, blank=True)
    description = models.CharField(max_length=255, blank=True)
    cta_label = models.CharField(max_length=80, blank=True)
    cta_url = models.CharField(max_length=160, blank=True)
    
