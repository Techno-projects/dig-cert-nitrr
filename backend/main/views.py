import pandas as pd
import json
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from main.models import Event, Faculty_Advisor, Organisation, Certificate, Faculty_Org, Faculty_Event
import jwt
import os
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont
import cv2
import base64
import numpy as np
from main.tasks import send_email_queue
import io
import re
from collections import Counter
from django.conf import settings
from io import BytesIO
from django.http import HttpResponse
from django.http import FileResponse
from django.http import JsonResponse
from django.contrib.auth.hashers import check_password, make_password
import hashlib
import math
from django.db.models import OuterRef, Subquery, Value
from django.db.models.functions import StrIndex, Substr, Length

load_dotenv()

secret_key = str(os.environ.get("SECRET_KEY"))

# to verify faculty's token


def is_faculty_auth(token):
  try:
    decoded = jwt.decode(token, secret_key, algorithms=['HS256'])
    email = decoded['email']
    faculty = decoded['faculty']
    if not Faculty_Advisor.objects.filter(email=email).exists():
      return False
    return faculty
  except Exception as e:
    print(e)
    return False

def get_certificate_font(coordinates):
    font_name = coordinates.pop('__font__', None)
    font_dir = settings.BASE_DIR / 'main' / 'fonts'
    fallback_fonts = [
        'DancingScript-Medium.ttf',
    ]
    for font in [font_name] + fallback_fonts:
        if font and (font_dir / font).exists():
            return str(font_dir / font), coordinates
    
    return str(font_dir / 'DancingScript-Medium.ttf'), coordinates


def get_text_color(coordinates):
    color = coordinates.pop('__text_color__', '#000000')
    if re.match(r'^#(?:[0-9a-fA-F]{3}){1,2}$', color, re.IGNORECASE):
        return color, coordinates
    return '#000000', coordinates

def get_widths(coordinates):
    widths = coordinates.pop('widths', None)
    return widths, coordinates

# to verify organisation user's token
def is_org_auth(token):
  try:
    decoded = jwt.decode(token, secret_key, algorithms=['HS256'])
    email = decoded['email']
    faculty = decoded['faculty']
    if not Organisation.objects.filter(email=email).exists():
      return False
    return (not faculty)
  except Exception as e:
    return False


def hashPassword(password):
  result = hashlib.md5(password.encode())
  return result.hexdigest()


def checkHashPassword(password, hashedPassword):
  hashed = hashlib.md5(password.encode())
  hashed = hashed.hexdigest()
  return hashed == hashedPassword


# just a / route
@api_view(['GET'])
def home(request):
  return Response({"message": "I am backend, the most powerful"})


# logging in organisation user
@api_view(["POST"])
def user_login(request):
  data = request.data
  try:
    user = Organisation.objects.get(email=data['email'])
    if check_password(data["password"], user.password):
      encoded_jwt = jwt.encode(
          {"email": data["email"], "faculty": 0}, os.environ.get('SECRET_KEY'), algorithm="HS256")
      response = Response({"ok": True, "message": "Logged in successfully",
                          "token": encoded_jwt}, status=status.HTTP_200_OK)
      response.set_cookie("login", encoded_jwt)
      return response
    else:
      return Response({"ok": False, "message": "Wrong Password"},
                      status=status.HTTP_401_UNAUTHORIZED)
  except Organisation.DoesNotExist as e:
    return Response({"ok": False, "message": "User doesn't exist"},
                    status=status.HTTP_401_UNAUTHORIZED)
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while user login"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# logging in the faculty
@api_view(["POST"])
def faculty_login(request):
  data = request.data
  try:
    check = Faculty_Advisor.objects.get(email=data["email"])
    if check_password(data["password"], check.password):
      encoded_jwt = jwt.encode({"email": data["email"],
                                "faculty": 1,
                                'iscdc': check.isCDC,
                                'isdsw': check.isDSW},
                               os.environ.get('SECRET_KEY'),
                               algorithm="HS256")
      return Response({"ok": True, 'token': encoded_jwt})
    else:
      return Response({"ok": False, "message": "Wrong Password"},
                      status=status.HTTP_401_UNAUTHORIZED)
  except Faculty_Advisor.DoesNotExist as e:
    return Response({"ok": False, "message": "Faculty doesn't exist"},
                    status=status.HTTP_401_UNAUTHORIZED)
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while faculty login"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# mail to be send to the participant
def send_certi_email(recipient_email, serial_no, event_name, org_name):
  body = f"<h3>Greetings participant</h3><br/>This is an auto generated email generated to inform that your certificate for the event <b>{event_name}</b> organized by the <b>{org_name}</b> at NIT Raipur has been signed by the college authority.<br/> You can view the ceritificate by visting at <u>https://digcert.nitrr.ac.in/getcertificate?serial={serial_no}</u><br/><br/>Thanking you."

  send_email_queue.delay("Certificate signed by Dig-Cert-NITRR", body, [recipient_email])


def send_cdc_email(event_name, org_name):
  cdc_faculty = Faculty_Advisor.objects.filter(isCDC=True)
  if len(cdc_faculty) != 1:
    return
  cdc_email = cdc_faculty[0].email

  mail_subject = "Event assigned by Dig-Cert-NITRR app"
  mail_body = f"<h3>Dear sir/mam,</h3><br/>This is an auto generated email to notify you that you are assigned to approve the participation certificates for the event <b>{event_name}</b> organised by the club/committee: <b>{org_name}<b/> of our college. You may login at <a href=\"https://digcert.nitrr.ac.in/Login?type=faculty\">Login Page</a><br/><br/>Thanking You."

  res = send_email_queue.delay(mail_subject, mail_body, [cdc_email])

def send_dsw_email(event_name, org_name):
  dsw_faculty = Faculty_Advisor.objects.filter(isDSW=True)
  if len(dsw_faculty) != 1:
    return
  dsw_email = dsw_faculty[0].email

  mail_subject = "Event assigned by Dig-Cert-NITRR app"
  mail_body = f"<h3>Dear sir/mam,</h3><br/>This is an auto generated email to notify you that you are assigned to approve the participation certificates for the event <b>{event_name}</b> organised by the club/committee: <b>{org_name}<b/> of our college. You may login at <a href=\"https://digcert.nitrr.ac.in/Login?type=faculty\">Login Page</a><br/><br/>Thanking You."

  res = send_email_queue.delay(mail_subject, mail_body, [dsw_email])


# return the headers of the excel file
@api_view(["POST"])
def get_rows(request):
  data = request.data
  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  if 'file' not in request.FILES:
    return Response({"ok": False, "message": "Please provide an excel file"})

  try:
    uploaded_file = request.FILES['file']
    df = pd.read_excel(uploaded_file)
    header_rows = df.columns.tolist()
    return Response({"message": header_rows}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "error": str(
        e), "message": "Error while uploading events"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# returns all the organisations
@api_view(["POST"])
def get_all_org(request):
  data = request.data
  decoded = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  email = decoded['email']

  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  try:
    orgs = Organisation.objects.all()
    org_names = []
    for i in orgs:
      if (i.email == email):
        continue
      org_names.append(i.name)
    return Response({"ok": True, "message": org_names}, status=status.HTTP_200_OK)
  except BaseException:
    return Response({"ok": False, "message": "Error fetching organisation"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# return all the faculties for current & partner organisations
@api_view(["POST"])
def get_faculties(request):
  data = request.data
  faculties = set()

  current_org = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  current_org = current_org['email']
  current_org_name = Organisation.objects.get(email=current_org).name
  current_facs = Faculty_Org.objects.filter(organisation_id=current_org_name)
  for i in current_facs:
    faculties.add(i.faculty_id)

  for i in data['partners']:
    faculties_of_i = Faculty_Org.objects.filter(organisation_id=i)
    for j in faculties_of_i:
      faculties.add(j.faculty_id)

  return Response({"ok": True, "message": list(faculties)}, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_cdc_events(request):
  try:
    pending_certis = Certificate.objects.filter(status='0')
    pending_certis = [
        cert for cert in pending_certis 
        if (cert.check_dispatch()=="CDC")
    ]

    signed_certis = Certificate.objects.filter(status='1')
    signed_certis = [
        cert for cert in signed_certis 
        if (cert.check_dispatch()=="CDC")
    ]
    
    event_df_cache = {}

    def get_event_df(event):
            if event.id not in event_df_cache:
                event_df_cache[event.id] = pd.read_excel(event.event_data)
            return event_df_cache[event.id]

    def process_certificate(certi, check_faculty=True):
      serial_no = certi.serial_no
      serial_list = serial_no.split("/")
      # For example: No./NITRR/dispatch/.../event_id/row_id
      event_id = int(serial_list[5])
      row_id = int(serial_list[6])
      
      # Retrieve the event record.
      event = Event.objects.get(id=event_id)
      
      # If checking signatures (for pending certificates), perform the faculty match.
      if check_faculty:
        coordinates = json.loads(event.coordinates)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        faculties_required = [
            item for item in list(coordinates.keys())
            if re.match(email_pattern, item)
        ]
        faculties_signed = json.loads(certi.faculty_advisor)
        if Counter(faculties_required) != Counter(faculties_signed):
            return None
      
      # Get organisation details.
      try:
        org = Organisation.objects.get(unique_name=event.organisation)
        org_name = org.name
      except Organisation.DoesNotExist:
        print(f"Organisation with unique_name '{event.organisation}' does not exist.")
        return None
      
      # Use the cached DataFrame.
      df = get_event_df(event)
      try:
        row_dict = df.iloc[row_id].to_dict()
      except Exception as e:
        print(f"Error fetching row {row_id} for event {event_id}: {e}")
        return None
      row_dict['Event'] = event.event_name
      row_dict['Organisation'] = org_name
      row_dict['Serial No'] = serial_no
      return row_dict

    pending_rows = [process_certificate(certi, check_faculty=True) for certi in pending_certis]
    signed_rows = [process_certificate(certi, check_faculty=False) for certi in signed_certis]
    
    pending_rows = [row for row in pending_rows if row is not None]
    signed_rows = [row for row in signed_rows if row is not None]

    def validate_row(row):
      if not isinstance(row, dict):
        raise ValueError(f"Row is not a dictionary: {row}")
      for key, value in row.items():
        if not isinstance(key, str):
          raise ValueError(f"Invalid key type in row: {key}")
        if isinstance(value, float) and math.isnan(value):
          row[key] = None  # Replace NaN with None
      return row

    pending_rows = [validate_row(row) for row in pending_rows]
    signed_rows = [validate_row(row) for row in signed_rows]

    return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})
      
  except Exception as e:
    print(f"Error in get_cdc_events: {e}")
    return Response(
      {"ok": False, "error": str(e), "message": "Error fetching CDC events"},
      status=500
    )
  
@api_view(["GET"])
def get_dsw_events(request):
  try:
    pending_certis = Certificate.objects.filter(status='0')
    pending_certis = [
        cert for cert in pending_certis 
        if (cert.check_dispatch()=="DSW")
    ]

    signed_certis = Certificate.objects.filter(status='1')
    signed_certis = [
        cert for cert in signed_certis 
        if (cert.check_dispatch()=="DSW")
    ]
    
    event_df_cache = {}

    def get_event_df(event):
            if event.id not in event_df_cache:
                event_df_cache[event.id] = pd.read_excel(event.event_data)
            return event_df_cache[event.id]

    def process_certificate(certi, check_faculty=True):
      serial_no = certi.serial_no
      serial_list = serial_no.split("/")
      # For example: No./NITRR/dispatch/.../event_id/row_id
      event_id = int(serial_list[5])
      row_id = int(serial_list[6])
      
      # Retrieve the event record.
      event = Event.objects.get(id=event_id)
      
      # If checking signatures (for pending certificates), perform the faculty match.
      if check_faculty:
        coordinates = json.loads(event.coordinates)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        faculties_required = [
            item for item in list(coordinates.keys())
            if re.match(email_pattern, item)
        ]
        faculties_signed = json.loads(certi.faculty_advisor)
        if Counter(faculties_required) != Counter(faculties_signed):
            return None
      
      # Get organisation details.
      try:
        org = Organisation.objects.get(unique_name=event.organisation)
        org_name = org.name
      except Organisation.DoesNotExist:
        print(f"Organisation with unique_name '{event.organisation}' does not exist.")
        return None
      
      # Use the cached DataFrame.
      df = get_event_df(event)
      try:
        row_dict = df.iloc[row_id].to_dict()
      except Exception as e:
        print(f"Error fetching row {row_id} for event {event_id}: {e}")
        return None
      row_dict['Event'] = event.event_name
      row_dict['Organisation'] = org_name
      row_dict['Serial No'] = serial_no
      return row_dict

    pending_rows = [process_certificate(certi, check_faculty=True) for certi in pending_certis]
    signed_rows = [process_certificate(certi, check_faculty=False) for certi in signed_certis]
    
    pending_rows = [row for row in pending_rows if row is not None]
    signed_rows = [row for row in signed_rows if row is not None]

    def validate_row(row):
      if not isinstance(row, dict):
        raise ValueError(f"Row is not a dictionary: {row}")
      for key, value in row.items():
        if not isinstance(key, str):
          raise ValueError(f"Invalid key type in row: {key}")
        if isinstance(value, float) and math.isnan(value):
          row[key] = None  # Replace NaN with None
      return row

    pending_rows = [validate_row(row) for row in pending_rows]
    signed_rows = [validate_row(row) for row in signed_rows]

    return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})
      
  except Exception as e:
    print(f"Error in get_dsw_events: {e}")
    return Response(
      {"ok": False, "error": str(e), "message": "Error fetching DSW events"},
      status=500
    )


def pil_image_to_base64(image):
  img_byte_array = io.BytesIO()
  image.save(img_byte_array, format='PNG')
  encoded_image = base64.b64encode(img_byte_array.getvalue()).decode('utf-8')
  return encoded_image

def put_serial_on_image(text_to_put, coordinate, image, event_data):
  font_path = settings.BASE_DIR / 'main' / 'fonts' / 'arial.ttf'

  box_width = (event_data.rel_width * image.size[0]) * image.size[0] / 1000
  box_height = (event_data.rel_height * image.size[1]) * image.size[1] / 775
  draw = ImageDraw.Draw(image)
  font = ImageFont.truetype(font_path,size=40)
  x = coordinate['x'] + (125 / 2)
  y = coordinate['y'] + (25 / 2)

  text_x = x + (box_width - font.getmask(str(text_to_put)).getbbox()[2]) / 2
  text_y = y + (box_height - font.getmask(str(text_to_put)).getbbox()[3]) / 2
  
  draw.text((text_x, text_y), str(text_to_put), fill="#000000", font=font)

  return image

def put_text_on_image(text_to_put, coordinate, image, event_data, font_path=None, text_color='#000000', width=None):
  def find_max_font_size(draw, text, font, max_width, max_height, font_path, width):
    font_size = 1
    while True:
      text_width = font.getmask(text).getbbox()[2]
      text_height = font.getmask(text).getbbox()[3]

      if (text_height < max_height) and (width is None or (text_width < width)):
        font_size += 1
        font = ImageFont.truetype(font_path,font_size)
      else:
        return font_size - 1

  try:
      if not font_path:
          font_path = settings.BASE_DIR / 'main' / 'fonts' / 'DancingScript-Medium.ttf'
      else:
          font_path = settings.BASE_DIR / 'main' / 'fonts' / font_path
      font = ImageFont.truetype(str(font_path), size=20)
  except Exception as e:
      font_path = settings.BASE_DIR / 'main' / 'fonts' / 'DancingScript-Medium.ttf'
      font = ImageFont.truetype(str(font_path), size=20)

  box_width = (event_data.rel_width * image.size[0]) * image.size[0] / 1000
  box_height = (event_data.rel_height * image.size[1]) * image.size[1] / 775
  draw = ImageDraw.Draw(image)
  max_font_size = find_max_font_size(draw, str(text_to_put), font, box_width, box_height, font_path, width)
  font = ImageFont.truetype(font_path,size=max_font_size)
  x = coordinate['x'] + (125 / 2)
  y = coordinate['y'] + (25 / 2)

  text_x = x + (box_width - font.getmask(str(text_to_put)).getbbox()[2]) / 2
  text_y = y + (box_height - font.getmask(str(text_to_put)).getbbox()[3]) / 2
  
  try:
      draw.text((text_x, text_y), str(text_to_put), fill=text_color, font=font)
  except:
      draw.text((text_x, text_y), str(text_to_put), fill="#000000", font=font)

  return image


def put_image_on_image(image_to_put_base64, coordinate, image, event_data):
  image_data = base64.b64decode(image_to_put_base64)
  image_array = np.frombuffer(image_data, np.uint8)
  faculty_sign_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
  gray_img = cv2.cvtColor(faculty_sign_image, cv2.COLOR_BGR2GRAY)
  ret, thresh = cv2.threshold(gray_img, 0, 255, cv2.THRESH_OTSU)
  pil_thresh = Image.fromarray(thresh)
  rgba_thresh = pil_thresh.convert("RGBA")
  datas = rgba_thresh.getdata()
  transparent_img = []
  for item in datas:
    if item[0] == 255 and item[1] == 255 and item[2] == 255:
      transparent_img.append((255, 255, 255, 0))
    else:
      transparent_img.append(item)
  rgba_thresh.putdata(transparent_img)
  # box_width = event_data.rel_width * image.size[0]
  # box_height = event_data.rel_height * image.size[1]
  image = image.convert("RGBA")
  rgba_thresh = rgba_thresh.convert("RGBA")
  box_width = (event_data.rel_width * image.size[0]) * image.size[0] / 800
  box_height = (event_data.rel_height * image.size[1]) * image.size[1] / 400
  rgba_thresh = rgba_thresh.resize(
      (int(box_width), int(box_height)), Image.LANCZOS)

  paste_box = (
      int(coordinate['x']),
      int(coordinate['y']),
      int(
          coordinate['x'] +
          rgba_thresh.width),
      int(
          coordinate['y'] +
          rgba_thresh.height))
  image.paste(rgba_thresh, paste_box, rgba_thresh)
  return image


@api_view(['GET'])
def preview_certificate(request):
  try:
    serial = request.GET.get('serial')
    print(serial)
    serial = serial.replace("_", "/")
    certificate = Certificate.objects.filter(serial_no=serial)
    event_id = int(serial.split('/')[5])
    event_data = Event.objects.get(id=event_id)

    if not certificate:
      return Response({"message": "No certificate found"}, status=status.HTTP_404_NOT_FOUND)

    faculty_signatures = json.loads(certificate[0].faculty_signatures)
    coordinates = json.loads(event_data.coordinates)
    candidate_data = json.loads(certificate[0].event_data)
    image = event_data.certificate
    image = Image.open(image)

    widths, coordinates = get_widths(coordinates.copy())
    selected_font, cleaned_coordinates = get_certificate_font(coordinates.copy())
    text_color, final_coordinates = get_text_color(cleaned_coordinates.copy())

    cdc_signature_base64 = certificate[0].cdc_signature
    cdc_coordinate = coordinates.get('cdc', None)

    for i in coordinates:
      key = i
      key_coordinate = coordinates.get(key, None)
      text_to_put = candidate_data.get(key, None)

      if (widths):
        key_width = widths.get(key, None)
      else:
        key_width = None

      if not key_coordinate or not text_to_put:
        continue

      image = put_text_on_image(text_to_put, key_coordinate, image, event_data, font_path=selected_font, text_color=text_color, width=key_width)

    serial_coord = coordinates.get("Serial No", None)
    if serial_coord:
      image = put_serial_on_image(serial, serial_coord, image, event_data)

    for i in coordinates:
      faculty_key = i

      key_coordinate = coordinates.get(faculty_key, None)
      signature_base64 = faculty_signatures.get(faculty_key, None)

      if not signature_base64:
        continue

      image = put_image_on_image(signature_base64, key_coordinate, image, event_data)

    if cdc_signature_base64:
      if cdc_coordinate:
        image = put_image_on_image(cdc_signature_base64, cdc_coordinate, image, event_data)

    image_io = BytesIO()
    is_preview = request.GET.get('preview', False)

    if is_preview:
      image.save(image_io, format="PNG")
      image_io.seek(0)
      response = HttpResponse(image_io, content_type="image/png")
      response['Content-Disposition'] = f'attachment; filename="{serial}.png"'
      return response
    else:
      if image.mode == 'RGBA':
        image = image.convert('RGB')
      image.save(image_io, format="JPEG", quality=50)
      image_io.seek(0)
      return HttpResponse(image_io, content_type="image/jpeg")
  except Exception as e:
    print(e)
    return Response({"ok": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def preview_event_certificate(request):
    try:
        event_data_file = request.FILES.get('event_data')
        certificate_file = request.FILES.get('certificate')
        coords_json = request.POST.get('coords')
        token = request.POST.get('token')
        rel_width = float(request.POST.get('rel_width'))
        rel_height = float(request.POST.get('rel_height'))
        selected_font = request.POST.get('font', 'DancingScript-Medium.ttf')
        text_color = request.POST.get('text_color', '#000000')
        widths_json = request.POST.get('widths', '{}')
        
        coords = json.loads(coords_json)
        widths = json.loads(widths_json)
        
        df = pd.read_excel(event_data_file)
        if df.empty:
            return Response({'message': 'Excel file is empty'}, status=400)
        
        first_row = df.iloc[0].to_dict()
        certificate_img = Image.open(certificate_file)
        
        class TempEventData:
            def __init__(self, rel_width, rel_height):
                self.rel_width = rel_width
                self.rel_height = rel_height
                self.coordinates = {
                    '__font__': selected_font,
                    '__text_color__': text_color
                }
        
        temp_event_data = TempEventData(rel_width, rel_height)
        
        for field, coordinate in coords.items():
            if field in first_row:
                certificate_img = put_text_on_image(first_row[field], coordinate, certificate_img, temp_event_data, font_path=selected_font, text_color=text_color, width=widths[field])
            elif field == "Serial No":
                certificate_img = put_serial_on_image("No./NITRR/XXX/YY/OC/0000/00", coordinate, certificate_img, temp_event_data)
            elif field == "cdc":
                certificate_img = put_text_on_image("Signature", coordinate, certificate_img, temp_event_data, font_path=selected_font, text_color=text_color)
            else:
                certificate_img = put_text_on_image(field, coordinate, certificate_img, temp_event_data, font_path=selected_font, text_color=text_color, width=widths[field])
        
        img_io = io.BytesIO()
        certificate_img.save(img_io, format='PNG')
        img_io.seek(0)
        
        return FileResponse(img_io, content_type='image/png')
    
    except Exception as e:
        return Response({'message': str(e)}, status=500)

@api_view(['GET'])
def get_certificate(request):
  try:
    serial = request.GET.get('serial')
    print(serial)
    serial = serial.replace("_", "/")
    certificate = Certificate.objects.filter(serial_no=serial)
    event_id = int(serial.split('/')[5])
    event_data = Event.objects.get(id=event_id)

    if not certificate:
      return Response({"message": "No certificate found"}, status=status.HTTP_404_NOT_FOUND)

    if certificate[0].status == "0":
      return Response({"message": "Certificate not verified"}, status=status.HTTP_401_UNAUTHORIZED)

    faculty_signatures = json.loads(certificate[0].faculty_signatures)
    coordinates = json.loads(event_data.coordinates)
    candidate_data = json.loads(certificate[0].event_data)
    image = event_data.certificate
    image = Image.open(image)

    widths, coordinates = get_widths(coordinates.copy())
    selected_font, cleaned_coordinates = get_certificate_font(coordinates.copy())
    text_color, final_coordinates = get_text_color(cleaned_coordinates.copy())

    cdc_signature_base64 = certificate[0].cdc_signature
    cdc_coordinate = coordinates.get('cdc', None)

    for i in coordinates:
      key = i
      key_coordinate = coordinates.get(key, None)
      text_to_put = candidate_data.get(key, None)
      if (widths):
        key_width = widths.get(key, None)
      else:
        key_width = None

      if not key_coordinate or not text_to_put:
        continue

      image = put_text_on_image(text_to_put, key_coordinate, image, event_data, font_path=selected_font, text_color=text_color, width=key_width)

    serial_coord = coordinates.get("Serial No", None)
    if serial_coord:
      image = put_serial_on_image(serial, serial_coord, image, event_data)

    for i in coordinates:
      faculty_key = i

      key_coordinate = coordinates.get(faculty_key, None)
      signature_base64 = faculty_signatures.get(faculty_key, None)

      if not signature_base64:
        continue

      image = put_image_on_image(signature_base64, key_coordinate, image, event_data)

    if cdc_signature_base64:
      if cdc_coordinate:
        image = put_image_on_image(cdc_signature_base64, cdc_coordinate, image, event_data)

    image_io = BytesIO()
    is_download = request.GET.get('download', False)

    if is_download:
      image.save(image_io, format="PNG")
      image_io.seek(0)
      response = HttpResponse(image_io, content_type="image/png")
      response['Content-Disposition'] = f'attachment; filename="{serial}.png"'
      return response
    else:
      if image.mode == 'RGBA':
        image = image.convert('RGB')
      image.save(image_io, format="JPEG", quality=50)
      image_io.seek(0)
      return HttpResponse(image_io, content_type="image/jpeg")
  except Exception as e:
    print(e)
    return Response({"ok": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
  # return Response({"certificate": image_base64})

# @api_view(["DELETE"])
# def delete_user(request):
#     email = request.data.get("email")

#     if not email:
#         return Response({"ok": False, "message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

#     try:
#         user = Organisation.objects.get(email=email)
#         user.delete()
#         return Response({"ok": True, "message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
#     except Organisation.DoesNotExist:
#         return Response({"ok": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"ok": False, "error": str(e), "message": "Error while deleting the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["POST"])
def user_register(request):
  data = request.data

  try:
    Organisation.objects.create(email=data["email"], password=make_password(data["password"]))
    return Response({"ok": True, "message": "Account created"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "error": str(
        e), "message": "Error while signing up the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def register_event(request):
  data = request.data
  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  event_db = data['event_data']           # event's excel file
  certi = data['certificate']             # event's certificate file
  isCDC = False                           # is cdc signature required for this event
  faculties_required = json.loads(data['faculties'])
  org_unique_name = Organisation.objects.get(email=data['user']).unique_name

  coordinates = json.loads(data['coords'])
  coordinates['__font__'] = data.get('font', 'DancingScript-Medium.ttf')
  coordinates['__text_color__'] = data.get('text_color', '#000000')
  coordinates['widths'] = json.loads(data['widths'])
  event_coordinates = json.dumps(coordinates)

  if data['cdc'] == 'true':
    isCDC = True
  try:
    Event.objects.create(
        organisation=org_unique_name,
        event_data=event_db,
        certificate=certi,
        coordinates=event_coordinates,
        event_name=data['event'],
        isCDC=isCDC,
        dispatch=data['dispatch'],
        faculties_required=json.dumps(faculties_required),
        rel_height=float(data['rel_height']),
        rel_width=float(data['rel_width']),
    )
    current_event_id = Event.objects.get(organisation=org_unique_name, event_name=data['event']).id
    faculty_events = []
    for i in faculties_required:
      print(i)
      faculty_i = Faculty_Advisor.objects.get(email=i)
      current_event = Event.objects.get(id=current_event_id)
      faculty_events.append(Faculty_Event(faculty=faculty_i, event=current_event))
    Faculty_Event.objects.bulk_create(faculty_events)

    org_name = Organisation.objects.get(email=data['user']).name
    mail_subject = "Event assigned by Dig-Cert-NITRR app"
    mail_body = f"<h3>Dear sir/mam,</h3><br/>This is an auto generated email to notify you that you are assigned to approve the participation certificates for the event <b>{data['event']}</b> organised by the club/committee: <b>{org_name}<b/> of our college. You may login at <a href=\"https://digcert.nitrr.ac.in/Login?type=faculty\">Login Page</a><br/><br/>Thanking You."

    res = send_email_queue.delay(mail_subject, mail_body, faculties_required)

    return Response({"message": "Uploaded successfully"}, status=status.HTTP_200_OK)
  except Exception as e:
    error_message = str(e)
    if "duplicate key value violates unique constraint" in error_message and "main_events_organisation_event_name" in error_message:
        return Response({"ok": False, "message": "Event with the same name already exists"}, 
                        status=status.HTTP_400_BAD_REQUEST)
    return Response({"ok": False, "error": str(e), "message": "Couldn't upload the event"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def faculty_register(request):
  data = request.data
  email = data["email"]
  password = data["password"]
  password = make_password(password)

  try:
    Faculty_Advisor.objects.create(
        email=email,
        password=password
    )
    return Response({"ok": True, "message": "Faculty registered"})
  except Exception as e:
    return Response({"ok": False, "error": str(
        e), "message": "Error while faculty registration"}, 400)


# get all the event details for the current signed-in faculty
@api_view(["POST"])
def get_event_details(request):
  data = request.data
  fac_email = data['email']

  try:
    fac_events = Faculty_Event.objects.filter(faculty=fac_email)

    def is_serial_present(serial):
      return Certificate.objects.filter(serial_no=serial).exists()

    def is_my_signed(serial):
      obj = Certificate.objects.filter(serial_no=serial)
      if (obj.exists()):
        who_signed = json.loads(obj[0].faculty_advisor)
        return data['email'] in who_signed
      return False

    def remove_nan_keys(data_list):
      # Iterate over each dictionary in the list
      for item in data_list:
        # Create a list of keys to delete
        keys_to_remove = [key for key, value in item.items() if isinstance(value, float) and math.isnan(value)]
        # Remove keys with NaN values
        for key in keys_to_remove:
          del item[key]
      return data_list

    pending_rows = []
    signed_rows = []
    for any_event in fac_events:
      event_file = any_event.event.event_data
      dispatch = any_event.event.dispatch
      org_unique_name = any_event.event.organisation
      students = pd.read_excel(event_file)
      students.reset_index(drop=False, inplace=True, names='Serial No')
      students['Serial No'] = students['Serial No'].apply(
          lambda x: "No./NITRR/" + dispatch + "/" + org_unique_name + "/OC/" + '{:04d}'.format(int(any_event.event.id)) + "/" + str(x))
      mask = students['Serial No'].apply(lambda x: not is_my_signed(x))
      mask1 = students['Serial No'].apply(lambda x: is_my_signed(x))
      all_unsigned_students = students[mask].to_dict(orient='records')
      all_signed_students = students[mask1].to_dict(orient='records')

      org_name = Organisation.objects.get(unique_name=any_event.event.organisation).name
      for x in all_unsigned_students:
        x['Organisation'] = org_name
        x['Event'] = any_event.event.event_name
        pending_rows.append(x)

      for x in all_signed_students:
        x['Organisation'] = org_name
        x['Event'] = any_event.event.event_name
        signed_rows.append(x)
    pending_rows = remove_nan_keys(pending_rows)
    signed_rows = remove_nan_keys(signed_rows)
    return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})
  except Faculty_Advisor.DoesNotExist as e:
    return Response({"ok": False, "message": "Faculty doesn't exist"})
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while fetching event details"})


def sign_by_fa(data, faculty_sign_image_base64):
  if (not is_faculty_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
  current_fac_data = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  del data['token']

  org_unique_name = Organisation.objects.get(name=data['Organisation']).unique_name
  event_details = Event.objects.get(event_name=data['Event'], organisation=org_unique_name)
  isCDC = event_details.isCDC
  dispatch = event_details.dispatch
  faculties_required = json.loads(event_details.faculties_required)

  cdc_email_send = False
  dsw_email_send = False
  certi_status = "0"
  if not isCDC:
    certi_status = "1"

  current_fac_email = current_fac_data['email']
  serial_no = data['Serial No']
  # faculty_sign_image_base64 = data['faculty_sign']

  del data['Serial No']
  # del data['faculty_sign']

  certi = Certificate.objects.filter(serial_no=serial_no)

  if len(certi) == 0:
    if len(faculties_required) == 1 and isCDC:
      if (dispatch=="CDC"):
        cdc_email_send = True
      else:
        dsw_email_send = True

    Certificate.objects.create(
        faculty_advisor=json.dumps([current_fac_email]),
        serial_no=serial_no,
        status=certi_status,
        event_data=json.dumps(data),
        faculty_signatures=json.dumps({current_fac_email: faculty_sign_image_base64})
    )
  else:
    fac_ids = certi[0].faculty_advisor
    fac_ids = json.loads(fac_ids)
    fac_ids.append(current_fac_email)
    fac_ids = json.dumps(fac_ids)

    fac_signs_base64 = json.loads(certi[0].faculty_signatures)
    fac_signs_base64[current_fac_email] = faculty_sign_image_base64
    signed_faculties = list(fac_signs_base64.keys())
    fac_signs_base64 = json.dumps(fac_signs_base64)

    Certificate.objects.filter(
        serial_no=serial_no).update(
        faculty_advisor=fac_ids,
        faculty_signatures=fac_signs_base64)

    if len(signed_faculties) == len(faculties_required) and isCDC:
      if (dispatch=="CDC"):
        cdc_email_send = True
      else:
        dsw_email_send = True
  return Response({"ok": True, "message": "Signed", "cdc_email_send": cdc_email_send, "dsw_email_send": dsw_email_send,
                  "organisation": data['Organisation'], "event": data['Event']}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def approveL0(request):
  data = request.data
  cdc_emails = set()
  dsw_emails = set()
  faculty_sign_image_base64 = data[len(data) - 1]
  for i in range(0, len(data) - 1):
    res = sign_by_fa(data[i], faculty_sign_image_base64)
    if res.data['cdc_email_send']:
      cdc_emails.add((res.data['organisation'], res.data['event']))
    elif res.data['dsw_email_send']:
      dsw_emails.add((res.data['organisation'], res.data['event']))

    if not res.data['ok']:
      return res
    
  if (bool(cdc_emails)):
    for i in cdc_emails:
      send_cdc_email(i[1], i[0])

  if (bool(dsw_emails)):
    for i in dsw_emails:
      send_dsw_email(i[1], i[0])
  
  return Response({"ok": True, "message": "Signed successfully"})


def approveCDC(data, cdc_sign):
  if (not is_faculty_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
  current_fac_email = jwt.decode(data['token'], secret_key, algorithms=['HS256'])
  current_fac_email = current_fac_email['email']
  del data['token']

  try:
    serial_no = data['Serial No']
    certificate = Certificate.objects.filter(serial_no=serial_no)

    if not certificate:
      return Response({'ok': False, 'message': "Certificate doesn't exist"},
                      status=status.HTTP_400_BAD_REQUEST)

    certificate = certificate[0]
    # cdc_sign = data['faculty_sign']

    if not cdc_sign:
      return Response({'ok': False, 'message': "Invalid signature"},
                      status=status.HTTP_400_BAD_REQUEST)

    Certificate.objects.filter(serial_no=serial_no).update(cdc_signature=cdc_sign, status="1")

    recipient_email = next((data.get(key) for key in data.keys() if key.strip().lower() == "email"), None)

    if recipient_email:
      serial_no = serial_no.replace("/", "_")
      send_certi_email(recipient_email, serial_no, data['Event'], data['Organisation'])
    return Response({'ok': True, 'message': 'Signed'})
  except Exception as e:
    return Response({'ok': False, 'error': str(
        e), 'message': "Error while signing the certificate"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def approveL1(request):
  data = request.data
  cdc_sign = data[len(data) - 1]
  for i in range(0, len(data) - 1):
    res = approveCDC(data[i], cdc_sign)
    if not res.data['ok']:
      return res

  return Response({"ok": True, "message": "Signed successfully"})


@api_view(["POST"])
def get_rows(request):
  data = request.data
  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  if 'file' not in request.FILES:
    return Response({"ok": False, "message": "Please provide an excel file"})

  try:
    uploaded_file = request.FILES['file']
    df = pd.read_excel(uploaded_file)
    header_rows = df.columns.tolist()
    return Response({"message": header_rows}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "error": str(
        e), "message": "Error while uploading events"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def get_all_org(request):
  data = request.data
  decoded = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  email = decoded['email']

  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  try:
    orgs = Organisation.objects.all()
    org_names = []
    for i in orgs:
      if (i.email == email):
        continue
      org_names.append(i.name)
    return Response({"ok": True, "message": org_names}, status=status.HTTP_200_OK)
  except BaseException:
    return Response({"ok": False, "message": "Error fetching organisation"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def get_faculties(request):
  data = request.data
  faculties = set()

  current_org = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  current_org = current_org['email']
  current_org_name = Organisation.objects.get(email=current_org).name
  current_facs = Faculty_Org.objects.filter(organisation_id=current_org_name)
  for i in current_facs:
    faculties.add(i.faculty_id)

  for i in data['partners']:
    faculties_of_i = Faculty_Org.objects.filter(organisation_id=i)
    for j in faculties_of_i:
      faculties.add(j.faculty_id)

  return Response({"ok": True, "message": list(faculties)}, status=status.HTTP_200_OK)