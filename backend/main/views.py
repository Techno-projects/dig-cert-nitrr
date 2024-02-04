import pandas as pd
import json
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import Event, Faculty_Advisor, Organisation, Certificate, Faculty_Org, Faculty_Event
import jwt
import os
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont
import cv2
import base64
import numpy as np

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


def approveCDC(data):
  if (not is_faculty_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
  current_fac_email = jwt.decode(data['token'], secret_key, algorithms=['HS256'])
  current_fac_email = current_fac_email['email']
  del data['token']
  faculty_sign_image = data['faculty_sign']

  # remove white bg from signature image
  try:
    image_data = base64.b64decode(data['faculty_sign'])
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
  except Exception as e:
    return Response({"ok": False, "message": "Error while removing background",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

  try:
    org_email = Organisation.objects.get(name=data['Organisation']).email
    event_details = Event.objects.get(event_name=data['Event'], organisation=org_email)
    isCDC = event_details.isCDC
    certi_status = "0"
    if not isCDC:
      certi_status = "1"
    coords = event_details.coordinates
    certificate = event_details.certificate
    coords = json.loads(coords)

    del data['Organisation']
    del data['Event']
    del data['faculty_sign']

    serial_no = data['Serial No']
    fac_signed_in = data['fac_signed_in']
    del data['fac_signed_in']
    file_extension = os.path.splitext(certificate.path)[1]
    output_filename = serial_no.replace("/", '_') + file_extension
    os.makedirs("/backend/signed_certificates/", exist_ok=True)
    file_location = f"/backend/signed_certificates/{output_filename}"

    img = Image.open(certificate)
    certi_exists = False
    if os.path.isfile(file_location):
      img = Image.open(file_location)
      certi_exists = True

    # find a suitable font size to write inside the box
    def find_max_font_size(draw, text, font, max_width, max_height):
      font_size = 1
      while True:
        text_width = font.getmask(text).getbbox()[2]
        text_height = font.getmask(text).getbbox()[3]

        if text_width < max_width and text_height < max_height:
          font_size += 1
          font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        else:
          return font_size - 1

    box_width = 559.5415632615322
    box_height = 111.90831265230646
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("DejaVuSans.ttf", size=20)
    max_font_size = find_max_font_size(draw, "YOUR TEXT HERE", font, box_width, box_height)
    font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)

    # now put the faculty sign on the certificate image
    try:
      fac_sign_x = coords['cdc']['x'] + (125 / 2)
      fac_sign_y = coords['cdc']['y'] + (25 / 2)
    except KeyError as e:
      return Response({"ok": False, "message": "You can't sign this certificate",
                      "error": str(e)}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    img = img.convert("RGBA")
    rgba_thresh = rgba_thresh.convert("RGBA")
    rgba_thresh = rgba_thresh.resize(
        (int(559.5415632615322), int(111.90831265230646)), Image.LANCZOS)

    paste_box = (
        int(fac_sign_x),
        int(fac_sign_y),
        int(
            fac_sign_x +
            rgba_thresh.width),
        int(
            fac_sign_y +
            rgba_thresh.height))
    output_filename = serial_no.replace("/", '_') + file_extension
    img.paste(rgba_thresh, paste_box, rgba_thresh)
    img.save(f"/backend/signed_certificates/{output_filename}", format=file_extension[1:])

    if certi_exists:
      Certificate.objects.filter(serial_no=serial_no).update(status="1")
    else:
      return Response({"ok": False, "message": "Certificate is not signed by the faculty advisor"},
                      status=status.HTTP_405_METHOD_NOT_ALLOWED)

    return Response({"ok": True, "message": "Signed"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "message": "Error while creating certificate",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def approveL1(request):
  data = request.data
  for i in range(0, len(data)):
    res = approveCDC(data[i])
    if not res.data['ok']:
      return res

  return Response({"ok": True, "message": "Signed successfully"})


# approve the (data), i.e. the participant details
def approve(data):
  if (not is_faculty_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
  current_fac_email = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  current_fac_email = current_fac_email['email']
  del data['token']
  faculty_sign_image = data['faculty_sign']

  # remove white bg from signature image
  try:
    image_data = base64.b64decode(data['faculty_sign'])
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
  except Exception as e:
    return Response({"ok": False, "message": "Error while removing background",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

  try:
    org_email = Organisation.objects.get(name=data['Organisation']).email
    event_details = Event.objects.get(event_name=data['Event'], organisation=org_email)
    isCDC = event_details.isCDC
    certi_status = "0"
    if not isCDC:
      certi_status = "1"
    coords = event_details.coordinates
    certificate = event_details.certificate
    coords = json.loads(coords)

    del data['Organisation']
    del data['Event']
    del data['faculty_sign']

    serial_no = data['Serial No']
    fac_signed_in = data['fac_signed_in']
    del data['fac_signed_in']
    file_extension = os.path.splitext(certificate.path)[1]
    output_filename = serial_no.replace("/", '_') + file_extension
    os.makedirs("/backend/signed_certificates/", exist_ok=True)
    file_location = f"/backend/signed_certificates/{output_filename}"

    img = Image.open(certificate)
    certi_exists = False
    if os.path.isfile(file_location):
      img = Image.open(file_location)
      certi_exists = True

    # find a suitable font size to write inside the box
    def find_max_font_size(draw, text, font, max_width, max_height):
      font_size = 1
      while True:
        text_width = font.getmask(text).getbbox()[2]
        text_height = font.getmask(text).getbbox()[3]

        if text_width < max_width and text_height < max_height:
          font_size += 1
          font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        else:
          return font_size - 1

    box_width = 559.5415632615322
    box_height = 111.90831265230646
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("DejaVuSans.ttf", size=20)
    max_font_size = find_max_font_size(draw, "YOUR TEXT HERE", font, box_width, box_height)
    font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)

    # paste all the text on the certificate image at their respective coordinates
    for i in data.keys():
      text_to_put = data[i]
      coordinate = coords[i]
      text_color = (0, 0, 0)
      font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)
      x = coordinate['x'] + (125 / 2)
      y = coordinate['y'] + (25 / 2)
      # draw.rectangle([x, y, x + box_width, y + box_height], outline="red")
      # draw.text((x, y), str(text_to_put), fill=text_color, font=font,)
      text_x = x + (box_width - font.getmask(str(text_to_put)).getbbox()[2]) / 2
      text_y = y + (box_height - font.getmask(str(text_to_put)).getbbox()[3]) / 2
      draw.text((text_x, text_y), str(text_to_put), fill="black", font=font)

    # now put the faculty sign on the certificate image
    try:
      fac_sign_x = coords[current_fac_email]['x'] + (125 / 2)
      fac_sign_y = coords[current_fac_email]['y'] + (25 / 2)
    except KeyError as e:
      return Response({"ok": False, "message": "You can't sign this certificate",
                      "error": str(e)}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    img = img.convert("RGBA")
    rgba_thresh = rgba_thresh.convert("RGBA")
    rgba_thresh = rgba_thresh.resize(
        (int(559.5415632615322), int(111.90831265230646)), Image.LANCZOS)

    paste_box = (
        int(fac_sign_x),
        int(fac_sign_y),
        int(
            fac_sign_x +
            rgba_thresh.width),
        int(
            fac_sign_y +
            rgba_thresh.height))
    output_filename = serial_no.replace("/", '_') + file_extension
    img.paste(rgba_thresh, paste_box, rgba_thresh)
    img.save(f"/backend/signed_certificates/{output_filename}", format=file_extension[1:])

    if certi_exists:
      fac_ids = Certificate.objects.get(serial_no=serial_no).faculty_advisor
      fac_ids = json.loads(fac_ids)
      fac_ids.append(current_fac_email)
      fac_ids = json.dumps(fac_ids)
      Certificate.objects.filter(serial_no=serial_no).update(faculty_advisor=fac_ids)
    else:
      Certificate.objects.create(
          certificate_path=f"/backend/signed_certificates/{output_filename}",
          faculty_advisor=json.dumps(
              [fac_signed_in]),
          serial_no=serial_no,
          status=certi_status)

    return Response({"ok": True, "message": "Signed"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "message": "Error while creating certificate",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# to approve all the selected rows from the table
@api_view(["POST"])
def approveL0(request):
  data = request.data
  for i in range(0, len(data)):
    res = approve(data[i])
    if not res.data['ok']:
      return res

  return Response({"ok": True, "message": "Signed successfully"})


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


def get_certi_by_serial(serial_no):
  serial_list = serial_no.split("/")
  dispatch = serial_list[0]
  event_id = serial_list[1]
  row_id = int(serial_list[2])

  event = Event.objects.get(id=event_id)
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
    row_i = get_certi_by_serial(certi.serial_no)
    pending_rows.append(row_i)

  for certi in signed_certis:
    row_i = get_certi_by_serial(certi.serial_no)
    signed_rows.append(row_i)
  return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})


@api_view(['GET'])
def get_certificate(request):
  serial = request.GET.get('serial')
  serial = serial.replace("_", "/")
  certificate = Certificate.objects.filter(serial_no=serial)
  if (not certificate):
    return Response({"message": "No certificate found"}, status=status.HTTP_404_NOT_FOUND)

  certi_ext = certificate[0].certificate_path.split('.')[1]
  serial = serial.replace("/", "_")
  return Response({"certificate": f"/signed_certificates/{serial}.{certi_ext}"})


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
  print(faculties_required)
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
def faculty_login(request):
  data = request.data
  try:
    check = Faculty_Advisor.objects.get(email=data["email"])
    if check.password == data["password"]:
      encoded_jwt = jwt.encode(
          {"email": data["email"], "faculty": 1}, os.environ.get('SECRET_KEY'), algorithm="HS256")
      return Response({"ok": True, 'token': encoded_jwt})
    else:
      return Response({"ok": False, "message": "Wrong Password"})
  except Faculty_Advisor.DoesNotExist as e:
    return Response({"ok": False, "message": "Faculty doesn't exist"})
  except Exception as e:
    return Response({"ok": False, "error": str(e), "message": "Error while faculty login"})


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


def approve(data):
  # data = request.data
  
  if (not is_faculty_auth(data['token'])):
    return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
  current_fac_email = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
  current_fac_email = current_fac_email['email']
  del data['token']
  faculty_sign_image = data['faculty_sign']

  try:
    # remove white bg from image
    image_data = base64.b64decode(data['faculty_sign'])
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
  except Exception as e:
    return Response({"ok": False, "message": "Error while removing background",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

  try:
    org_email = Organisation.objects.get(name=data['Organisation']).email
    event_details = Event.objects.get(event_name=data['Event'], organisation=org_email)
    isCDC = event_details.isCDC
    certi_status = "0"
    if not isCDC:
      certi_status = "1"
    coords = event_details.coordinates
    certificate = event_details.certificate
    coords = json.loads(coords)

    del data['Organisation']
    del data['Event']
    del data['faculty_sign']

    serial_no = data['Serial No']
    fac_signed_in = data['fac_signed_in']
    del data['fac_signed_in']
    file_extension = os.path.splitext(certificate.path)[1]
    output_filename = serial_no.replace("/", '_') + file_extension
    os.makedirs("/backend/signed_certificates/", exist_ok=True)
    file_location = f"/backend/signed_certificates/{output_filename}"

    img = Image.open(certificate)
    certi_exists = False
    if os.path.isfile(file_location):
      img = Image.open(file_location)
      certi_exists = True

    def find_max_font_size(draw, text, font, max_width, max_height):
      font_size = 1
      while True:
        text_width = font.getmask(text).getbbox()[2]
        text_height = font.getmask(text).getbbox()[3]

        if text_width < max_width and text_height < max_height:
          font_size += 1
          font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        else:
          return font_size - 1

    box_width = 559.5415632615322
    box_height = 111.90831265230646
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("DejaVuSans.ttf", size=20)
    max_font_size = find_max_font_size(draw, "YOUR TEXT HERE", font, box_width, box_height)
    font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)

    for i in data.keys():
      text_to_put = data[i]
      coordinate = coords[i]
      text_color = (0, 0, 0)
      font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)
      x = coordinate['x'] + (125 / 2)
      y = coordinate['y'] + (25 / 2)
      # draw.rectangle([x, y, x + box_width, y + box_height], outline="red")
      # draw.text((x, y), str(text_to_put), fill=text_color, font=font,)
      text_x = x + (box_width - font.getmask(str(text_to_put)).getbbox()[2]) / 2
      text_y = y + (box_height - font.getmask(str(text_to_put)).getbbox()[3]) / 2
      draw.text((text_x, text_y), str(text_to_put), fill="black", font=font)

    try:
      fac_sign_x = coords[current_fac_email]['x'] + (125 / 2)
      fac_sign_y = coords[current_fac_email]['y'] + (25 / 2)
    except KeyError as e:
      return Response({"ok": False, "message": "You can't sign this certificate",
                      "error": str(e)}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    img = img.convert("RGBA")
    rgba_thresh = rgba_thresh.convert("RGBA")
    rgba_thresh = rgba_thresh.resize(
        (int(559.5415632615322), int(111.90831265230646)), Image.LANCZOS)

    paste_box = (
        int(fac_sign_x),
        int(fac_sign_y),
        int(
            fac_sign_x +
            rgba_thresh.width),
        int(
            fac_sign_y +
            rgba_thresh.height))
    output_filename = serial_no.replace("/", '_') + file_extension
    img.paste(rgba_thresh, paste_box, rgba_thresh)
    img.save(f"/backend/signed_certificates/{output_filename}", format=file_extension[1:])

    if certi_exists:
      fac_ids = Certificate.objects.get(serial_no=serial_no).faculty_advisor
      fac_ids = json.loads(fac_ids)
      fac_ids.append(current_fac_email)
      fac_ids = json.dumps(fac_ids)
      Certificate.objects.filter(serial_no=serial_no).update(faculty_advisor=fac_ids)
    else:
      Certificate.objects.create(
          faculty_advisor=json.dumps(
              [fac_signed_in]),
          serial_no=serial_no,
          status=certi_status,
          certificate_path=f"/backend/signed_certificates/{output_filename}")

    return Response({"ok": True, "message": "Signed"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "message": "Error while creating certificate",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def approveL0(request):
  data = request.data
  for i in range(0, len(data)):
    res = approve(data[i])
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
