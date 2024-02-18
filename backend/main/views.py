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
    if user.password == data["password"]:
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


# register an event
@api_view(["POST"])
def register_event(request):
  data = request.data
  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  event_db = data['event_data']           # event's excel file
  certi = data['certificate']             # event's certificate file
  isCDC = False                           # is cdc signature required for this event
  faculties_required = json.loads(data['faculties'])
  if data['cdc'] == 'true':
    isCDC = True
  try:
    Event.objects.create(
        organisation=data['user'],
        event_data=event_db,
        certificate=certi,
        coordinates=data['coords'],
        event_name=data['event'],
        isCDC=isCDC,
        dispatch=data['dispatch'])
    current_event_id = Event.objects.get(organisation=data['user'], event_name=data['event']).id

    faculty_events = []                 # store faculty-event maps
    for i in faculties_required:
      faculty_i = Faculty_Advisor.objects.get(email=i)
      current_event = Event.objects.get(id=current_event_id)
      faculty_events.append(Faculty_Event(faculty=faculty_i, event=current_event))

    # now store all the faculty-event maps in the DB
    Faculty_Event.objects.bulk_create(faculty_events)

    return Response({"message": "Uploaded successfully"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Couldn't upload the event"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# logging in the faculty
@api_view(["POST"])
def faculty_login(request):
  data = request.data
  try:
    check = Faculty_Advisor.objects.get(email=data["email"])
    if check.password == data["password"]:
      encoded_jwt = jwt.encode({"email": data["email"],
                                "faculty": 1,
                                'iscdc': check.isCDC},
                               os.environ.get('SECRET_KEY'),
                               algorithm="HS256")
      return Response({"ok": True, 'token': encoded_jwt})
    else:
      return Response({"ok": False, "message": "Wrong Password"})
  except Faculty_Advisor.DoesNotExist as e:
    return Response({"ok": False, "message": "Faculty doesn't exist"})
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while faculty login"})


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

    pending_rows = []
    signed_rows = []
    for any_event in fac_events:
      event_file = any_event.event.event_data
      dispatch = any_event.event.dispatch
      students = pd.read_excel(event_file)
      students.reset_index(drop=False, inplace=True, names='Serial No')
      students['Serial No'] = students['Serial No'].apply(
          lambda x: dispatch + "/" + str(any_event.event.id) + "/" + str(x))
      mask = students['Serial No'].apply(lambda x: not is_my_signed(x))
      mask1 = students['Serial No'].apply(lambda x: is_my_signed(x))
      all_unsigend_students = students[mask].to_dict(orient='records')
      all_signed_students = students[mask1].to_dict(orient='records')

      org_name = Organisation.objects.get(email=any_event.event.organisation).name
      for x in all_unsigend_students:
        x['Organisation'] = org_name
        x['Event'] = any_event.event.event_name
        pending_rows.append(x)

      for x in all_signed_students:
        x['Organisation'] = org_name
        x['Event'] = any_event.event.event_name
        signed_rows.append(x)

    return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})
  except Faculty_Advisor.DoesNotExist as e:
    return Response({"ok": False, "message": "Faculty doesn't exist"})
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while fetching event details"})


def send_certi_email(recipient_email, serial_no, event_name, org_name):
  body = f"<h3>Greetings participant</h3><br/>This is an auto generated email generated to inform that your certificate for the event <b>{event_name}</b> organized by the <b>{org_name}</b> at NIT Raipur has beed signed by the college authority.<br/> You can view the ceritificate by visting at <u>https://digcert.nitrr.ac.in/getcertificate?serial={serial_no}</u><br/><br/>Thanking you."

  send_email_queue.delay("Certificate signed by dig-cert-nitrr", body, [recipient_email])


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


def cdc_get_certi_by_serial(serial_no, certificate):
  serial_list = serial_no.split("/")
  dispatch = serial_list[0]
  event_id = serial_list[1]
  row_id = int(serial_list[2])

  event = Event.objects.get(id=event_id)

  if certificate:
    coordinates = json.loads(event.coordinates)
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    faculties_required = []

    for item in list(coordinates.keys()):
      if re.match(email_pattern, item):
        faculties_required.append(item)

    faculties_signed = json.loads(certificate.faculty_advisor)

    c1 = Counter(faculties_required)
    c2 = Counter(faculties_signed)

    print(serial_no)
    print(faculties_required)
    print(faculties_signed)

    if c1 != c2:
      return

  org_name = Organisation.objects.get(email=event.organisation).name
  event_name = event.event_name
  event_data = event.event_data
  df = pd.read_excel(event_data)

  row_dict = df.iloc[row_id].to_dict()
  row_dict['Event'] = event_name
  row_dict['Organisation'] = org_name
  row_dict['Serial No'] = serial_no
  return row_dict


@api_view(["GET"])
def get_cdc_events(request):
  pending_certis = Certificate.objects.filter(status='0')
  signed_certis = Certificate.objects.filter(status='1')
  pending_rows = []
  signed_rows = []
  for certi in pending_certis:
    row_i = cdc_get_certi_by_serial(certi.serial_no, certi)
    if not row_i:
      continue
    pending_rows.append(row_i)

  for certi in signed_certis:
    row_i = cdc_get_certi_by_serial(certi.serial_no, None)
    if not row_i:
      continue
    signed_rows.append(row_i)
  return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})


def pil_image_to_base64(image):
  img_byte_array = io.BytesIO()
  image.save(img_byte_array, format='PNG')
  encoded_image = base64.b64encode(img_byte_array.getvalue()).decode('utf-8')
  return encoded_image


def put_text_on_image(text_to_put, coordinate, image, event_data):
  def find_max_font_size(draw, text, font, max_width, max_height):
    font_size = 1
    while True:
      text_width = font.getmask(text).getbbox()[2]
      text_height = font.getmask(text).getbbox()[3]

      if text_height < max_height:
        font_size += 1
        font = ImageFont.truetype("DejaVuSans.ttf", font_size)
      else:
        return font_size - 1

  box_width = event_data.rel_width * image.size[0]
  box_height = event_data.rel_height * image.size[1]
  draw = ImageDraw.Draw(image)
  font = ImageFont.truetype("DejaVuSans.ttf", size=20)
  max_font_size = find_max_font_size(draw, str(text_to_put), font, box_width, box_height)
  font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)
  text_color = (0, 0, 0)
  x = coordinate['x'] + (125 / 2)
  y = coordinate['y'] + (25 / 2)

  text_x = x + (box_width - font.getmask(str(text_to_put)).getbbox()[2]) / 2
  text_y = y + (box_height - font.getmask(str(text_to_put)).getbbox()[3]) / 2
  draw.text((text_x, text_y), str(text_to_put), fill="black", font=font)

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
  box_width = event_data.rel_width * image.size[0]
  box_height = event_data.rel_height * image.size[1]
  image = image.convert("RGBA")
  rgba_thresh = rgba_thresh.convert("RGBA")
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
def get_certificate(request):
  serial = request.GET.get('serial')
  serial = serial.replace("_", "/")
  certificate = Certificate.objects.filter(serial_no=serial)
  event_id = serial.split('/')[1]
  event_data = Event.objects.get(id=event_id)

  if not certificate:
    return Response({"message": "No certificate found"}, status=status.HTTP_404_NOT_FOUND)

  if certificate[0].status != "1":
    return Response({"message": "Certificate not verified"}, status=status.HTTP_401_UNAUTHORIZED)

  faculty_signatures = json.loads(certificate[0].faculty_signatures)
  coordinates = json.loads(event_data.coordinates)
  candidate_data = json.loads(certificate[0].event_data)
  image = event_data.certificate
  image = Image.open(image)

  cdc_signature_base64 = certificate[0].cdc_signature
  cdc_coordinate = coordinates.get('cdc', None)

  for i in coordinates:
    key = i
    key_coordinate = coordinates.get(key, None)
    text_to_put = candidate_data.get(key, None)

    if not key_coordinate or not text_to_put:
      continue

    image = put_text_on_image(text_to_put, key_coordinate, image, event_data)

  serial_coord = coordinates.get("Serial No", None)
  if serial_coord:
    image = put_text_on_image(serial, serial_coord, image, event_data)

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

  image_base64 = pil_image_to_base64(image)
  return Response({"certificate": image_base64})


@api_view(["POST"])
def user_register(request):
  data = request.data
  try:
    Organisation.objects.create(email=data["email"], password=data["password"])
    return Response({"ok": True, "message": "Account created"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "error": str(
        e), "message": "Error while signing up the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# logging in user
@api_view(["POST"])
def user_login(request):
  data = request.data
  try:
    user = Organisation.objects.get(email=data['email'])
    if user.password == data["password"]:
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


@api_view(["POST"])
def register_event(request):
  data = request.data
  if (not is_org_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

  event_db = data['event_data']           # event's excel file
  certi = data['certificate']             # event's certificate file
  isCDC = False                           # is cdc signature required for this event
  faculties_required = json.loads(data['faculties'])

  org_name = Organisation.objects.get(email=data['user']).name
  mail_subject = "Event assigned by dig-cert-nitrr app"
  mail_body = f"<h3>Greetings professor,</h3><br/>This is an auto generated email to notify you that you are assigned to approve the participation certificates for the event <b>{data['event']}</b> organised by the club/committee: <b>{org_name}<b/> of our college.<br/><br/>Thanking You."

  # res = send_email_queue.delay(mail_subject, mail_body, faculties_required)
  if data['cdc'] == 'true':
    isCDC = True
  try:
    Event.objects.create(
        organisation=data['user'],
        event_data=event_db,
        certificate=certi,
        coordinates=data['coords'],
        event_name=data['event'],
        isCDC=isCDC,
        dispatch=data['dispatch'],
        rel_height=float(data['rel_height']),
        rel_width=float(data['rel_width']),
    )
    current_event_id = Event.objects.get(organisation=data['user'], event_name=data['event']).id
    faculty_events = []
    for i in faculties_required:
      faculty_i = Faculty_Advisor.objects.get(email=i)
      current_event = Event.objects.get(id=current_event_id)
      faculty_events.append(Faculty_Event(faculty=faculty_i, event=current_event))
    Faculty_Event.objects.bulk_create(faculty_events)

    return Response({"message": "Uploaded successfully"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Couldn't upload the event"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def faculty_register(request):
  data = request.data
  email = data["email"]
  name = data["name"]
  password = data["password"]
  organisation_code = data["organisation_code"]

  try:
    Faculty_Advisor.objects.create(
        email=email,
        name=name,
        password=password,
        organisation_code=organisation_code)
    return Response({"ok": True, "message": "Faculty registered"})
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while faculty registration"})


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

    pending_rows = []
    signed_rows = []
    for any_event in fac_events:
      event_file = any_event.event.event_data
      dispatch = any_event.event.dispatch
      students = pd.read_excel(event_file)
      students.reset_index(drop=False, inplace=True, names='Serial No')
      students['Serial No'] = students['Serial No'].apply(
          lambda x: dispatch + "/" + str(any_event.event.id) + "/" + str(x))
      mask = students['Serial No'].apply(lambda x: not is_my_signed(x))
      mask1 = students['Serial No'].apply(lambda x: is_my_signed(x))
      all_unsigned_students = students[mask].to_dict(orient='records')
      all_signed_students = students[mask1].to_dict(orient='records')

      org_name = Organisation.objects.get(email=any_event.event.organisation).name
      for x in all_unsigned_students:
        x['Organisation'] = org_name
        x['Event'] = any_event.event.event_name
        pending_rows.append(x)

      for x in all_signed_students:
        x['Organisation'] = org_name
        x['Event'] = any_event.event.event_name
        signed_rows.append(x)

    return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})
  except Faculty_Advisor.DoesNotExist as e:
    return Response({"ok": False, "message": "Faculty doesn't exist"})
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while fetching event details"})


def sign_by_fa(data):
  if (not is_faculty_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
  current_fac_data = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  del data['token']

  org_email = Organisation.objects.get(name=data['Organisation']).email
  event_details = Event.objects.get(event_name=data['Event'], organisation=org_email)
  isCDC = event_details.isCDC

  certi_status = "0"
  if not isCDC:
    certi_status = "1"

  current_fac_email = current_fac_data['email']
  serial_no = data['Serial No']
  faculty_sign_image_base64 = data['faculty_sign']

  del data['Serial No']
  del data['faculty_sign']

  certi = Certificate.objects.filter(serial_no=serial_no)

  if len(certi) == 0:
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
    fac_signs_base64 = json.dumps(fac_signs_base64)

    Certificate.objects.filter(
        serial_no=serial_no).update(
        faculty_advisor=fac_ids,
        faculty_signatures=fac_signs_base64)
  return Response({"ok": True, "message": "Signed"}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def approveL0(request):
  data = request.data
  for i in range(0, len(data)):
    res = sign_by_fa(data[i])
    print(res)
    if not res.data['ok']:
      return res

  return Response({"ok": True, "message": "Signed successfully"})


def approveCDC(data):
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
    cdc_sign = data['faculty_sign']

    if not cdc_sign:
      return Response({'ok': False, 'message': "Invalid signature"},
                      status=status.HTTP_400_BAD_REQUEST)

    Certificate.objects.filter(serial_no=serial_no).update(cdc_signature=cdc_sign, status="1")

    receipient_email = data.get('email', None)
    if not receipient_email:
      receipient_email = data.get('Email', None)

    if receipient_email:
      serial_no = serial_no.replace("/", "_")
      send_certi_email(receipient_email, serial_no, data['Event'], data['Organisation'])
    return Response({'ok': True, 'message': 'Signed'})
  except Exception as e:
    return Response({'ok': False, 'error': str(
        e), 'message': "Error while signing the certificate"})


@api_view(["POST"])
def approveL1(request):
  data = request.data
  for i in range(0, len(data)):
    res = approveCDC(data[i])
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
