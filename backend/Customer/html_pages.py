
def email_verified_successfully_page(msg, success):

    email_verify_html =  html_content = f"""
            <html>
                <head>
                    <title>Email Verified</title>
                    <style>
                        body {{
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            text-align: center;
                            padding: 50px;
                        }}
                        h1 {{
                            color: #4CAF50;
                        }}
                        p {{
                            font-size: 18px;
                        }}
                        .container {{
                            background-color: white;
                            border-radius: 10px;
                            padding: 30px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            max-width: 600px;
                            margin: auto;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>{msg}!</h1>
                        {'<p>Thank you for verifying your email address. You can now proceed to log in and start using our platform.</p>' if success else '<p>Token is Expired or Invalid token</p>'}
                    </div>
                </body>
            </html>
            """
    
    return email_verify_html