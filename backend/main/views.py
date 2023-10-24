import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Event, Faculty_Advisor, Organisation, Certificate, Faculty_Org
import json
import jwt
import os
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont
import cv2
import base64
import numpy as np

load_dotenv()


def is_faculty_auth(token):
    try:
        decoded = jwt.decode(token, os.environ.get("SECRET_KEY"), algorithms=['HS256'])
        email = decoded['email']
        faculty = decoded['faculty']
        if not Faculty_Advisor.objects.filter(email=email).exists():
            return False
        return faculty
    except Exception as e:
        return False


def is_org_auth(token):
    try:
        decoded = jwt.decode(token, os.environ.get("SECRET_KEY"), algorithms=['HS256'])
        email = decoded['email']
        faculty = decoded['faculty']
        if not Organisation.objects.filter(email=email).exists():
            return False
        return (not faculty)
    except Exception as e:
        return False


@api_view(['GET'])
def home(request):
    return Response({"message": "I am backend, the most powerful"})


@api_view(["POST"])
@permission_classes([AllowAny])
def user_register(request):
    data = request.data
    try:
        Organisation.objects.create(email=data["email"], password=data["password"])
        return Response({"ok": True, "message": "Account created"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while signing up the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# logging in user
@api_view(["POST"])
@permission_classes([AllowAny])
def user_login(request):
    data = request.data
    try:
        user = Organisation.objects.get(email=data['email'])
        if user.password == data["password"]:
            encoded_jwt = jwt.encode({"email": data["email"], "faculty": 0}, os.environ.get('SECRET_KEY'), algorithm="HS256")
            response = Response({"ok": True, "message": "Logged in successfully", "token": encoded_jwt}, status=status.HTTP_200_OK)
            response.set_cookie("login", encoded_jwt)
            return response
        else:
            return Response({"ok": False, "message": "Wrong Password"}, status=status.HTTP_401_UNAUTHORIZED)
    except Organisation.DoesNotExist as e:
        return Response({"ok": False, "message": "User doesn't exist"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while user login"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def register_event(request):
    data = request.data
    if (not is_org_auth(data['token'])):
        return Response({"ok": False, "message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
    
    event_db = data['event_data']
    certi = data['certificate']
    isCDC = False
    if data['cdc'] == 'true':
        isCDC = True
    try:
        Event.objects.create(organisation=data['user'], event_data=event_db, certificate=certi, coordinates=data['coords'], event_name=data['event'], isCDC=isCDC)
        return Response({"message": "Uploaded successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Couldn't upload the event"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def faculty_register(request):
    data = request.data
    email = data["email"]
    name = data["name"]
    password = data["password"]
    organisation_code = data["organisation_code"]

    try:
        Faculty_Advisor.objects.create(email=email, name=name, password=password, organisation_code=organisation_code)
        return Response({"ok": True, "message": "Faculty registered"})
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while faculty registration"})


@api_view(["POST"])
def faculty_login(request):
    data = request.data
    try:
        check = Faculty_Advisor.objects.get(email=data["email"])
        if check.password == data["password"]:
            encoded_jwt = jwt.encode({"email": data["email"], "faculty": 1}, os.environ.get('SECRET_KEY'), algorithm="HS256")
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
    try:
        orgs = Faculty_Org.objects.filter(faculty_id=data['email'])
        
        # current faculty is related to all in this list
        organisations = []
        for i in orgs:
            org_name = i.organisation_id
            org_email = (Organisation.objects.get(name=org_name)).email
            organisations.append([org_email, org_name])
        
        def is_serial_present(serial):
            return Certificate.objects.filter(serial_no=serial).exists()
        
        def is_my_signed(serial):
            obj = Certificate.objects.filter(serial_no=serial)
            if (obj.exists()):
                who_signed = obj[0].faculty_advisor_id
                return who_signed == data['email']
            return False
        
        pending_rows = []
        signed_rows = []
        for i in organisations:
            events_of_org = Event.objects.filter(organisation=i[0])
            for any_event in events_of_org:
                students = pd.read_excel(any_event.event_data)
                students.reset_index(drop=False, inplace=True, names='Serial No')
                students['Serial No'] = students['Serial No'].apply(lambda x: str(any_event.id) + "/" + str(x))
                mask = students['Serial No'].apply(lambda x: not is_serial_present(x))
                mask1 = students['Serial No'].apply(lambda x: is_my_signed(x))
                all_unsigend_students = students[mask].to_dict(orient='records')
                all_sigend_students = students[mask1].to_dict(orient='records')
                for x in all_unsigend_students:
                    x['Organisation'] = i[1]
                    x['Event'] = any_event.event_name
                    pending_rows.append(x)
                
                for x in all_sigend_students:
                    x['Organisation'] = i[1]
                    x['Event'] = any_event.event_name
                    signed_rows.append(x)

            return Response({"ok": True, "pending": pending_rows, "signed": signed_rows})
    except Faculty_Advisor.DoesNotExist as e:
        return Response({"ok": False, "message": "Faculty doesn't exist"})
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while fetching event details"})


@api_view(["POST"])
def approveL0(request):
    data = request.data
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
        ret,thresh = cv2.threshold(gray_img, 0, 255, cv2.THRESH_OTSU)
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
        return Response({"ok": False, "message": "Error while removing background", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        org_email = Organisation.objects.get(name=data['Organisation']).email
        event_details = Event.objects.get(event_name=data['Event'], organisation=org_email)
        coords = event_details.coordinates
        certificate = event_details.certificate
        coords = json.loads(coords)

        del data['Organisation']
        del data['Event']
        del data['faculty_sign']

        serial_no = data['Serial No']
        fac_signed_in = data['fac_signed_in']
        del data['Serial No']
        del data['fac_signed_in']
        img = Image.open(certificate)
        image_width, image_height = img.size
        font_percentage = 0.03
        font_size = int(min(image_width, image_height) * font_percentage)
        draw = ImageDraw.Draw(img)
        font = ImageFont.truetype("DejaVuSans.ttf", size=font_size)

        for i in data.keys():
            text_to_put = data[i]
            coordinate = coords[i]
            text_color = (0, 0, 0)
            draw.text((coordinate['x'], coordinate['y']), str(text_to_put), fill=text_color, font=font,)
        
        fac_sign_x = coords[current_fac_email]['x']
        fac_sign_y = coords[current_fac_email]['y']

        img = img.convert("RGBA")
        rgba_thresh = rgba_thresh.convert("RGBA")
        file_extension = os.path.splitext(certificate.path)[1]
        paste_box = (int(fac_sign_x), int(fac_sign_y), int(fac_sign_x + rgba_thresh.width), int(fac_sign_y + rgba_thresh.height))
        output_filename = serial_no.replace("/", '_') + file_extension
        img.paste(rgba_thresh, paste_box, rgba_thresh)
        img.save(f"/backend/signed_certificates/{output_filename}", format=file_extension[1:])
        Certificate.objects.create(faculty_advisor_id=fac_signed_in, serial_no=serial_no, status="0")

        return Response({"ok": True, "message": "Signed"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "message": "Error while creating certificate", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return Response({"ok": False, "error": str(e), "message": "Error while uploading events"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    except:
        return Response({"ok": False, "message": "Error fetching organisation"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def get_faculties(request):
    data = request.data
    faculties = []

    current_org = jwt.decode(data['token'], os.environ.get("SECRET_KEY"), algorithms=['HS256'])
    current_org = current_org['email']
    current_org_name = Organisation.objects.get(email=current_org).name
    current_facs = Faculty_Org.objects.filter(organisation_id=current_org_name)
    for i in current_facs:
        faculties.append(i.faculty_id)

    for i in data['partners']:
        faculties_of_i = Faculty_Org.objects.filter(organisation_id=i)
        for j in faculties_of_i:
            faculties.append(j.faculty_id)

    return Response({"ok": True, "message": faculties}, status=status.HTTP_200_OK)