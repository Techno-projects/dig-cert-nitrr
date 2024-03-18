import smtplib
from email.mime.text import MIMEText
import ssl
import os
from dotenv import load_dotenv
load_dotenv()

subject = "LDAP Account Activated."
body = "<h3> Dear <b> test </b> Your LDAP Account has been activated to access the internet in NIT Raipur. <br> User-Id is your Roll number/User-ID <br>  Passwd is: a#1ghIH Please Change the details like password etc by clicking <u>Change Account Information</u> given at https://ldap.nitrr.ac.in/ </h3>"
# sender = 'ldapmaster@nitrr.ac.in'
sender = 'digitalcertificate@nitrr.ac.in'
recipients = ["phatwar75.btech2020.it@nitrr.ac.in", "pranshul.hatwar@gmail.com"]


def send_email(subject, body, recipients):
  if len(recipients) == 0:
    return
  msg = MIMEText(body, 'html')
  msg['Subject'] = subject
  msg['From'] = sender
  msg['To'] = ', '.join(recipients)
  context = ssl.create_default_context()
  with smtplib.SMTP('smtp.gmail.com', 587) as smtp_server:
    smtp_server.starttls(context=context)
    smtp_server.login(sender, os.getenv("SENDER_PASSWORD"))
    smtp_server.sendmail(sender, recipients, msg.as_string())
  print("Message sent!")