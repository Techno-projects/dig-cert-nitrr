import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
# from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .models import Events, Faculty_Advisors, Users, Certificates, Faculty_Org
import json
import jwt
import os
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

# class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)

#         # Add custom claims
#         # token['email'] = user.email
#         # token['faculty'] = user.is_faculty
#         # token['organisation'] = user.is_org
#         # ...

#         return token

# class MyTokenObtainPairView(TokenObtainPairView):
#     serializer_class = MyTokenObtainPairSerializer

load_dotenv()

# registering user
@api_view(["POST"])
@permission_classes([AllowAny])
def user_register(request):
    data = request.data
    try:
        Users.objects.create(email=data["email"], password=data["password"])
        return Response({"ok": True, "message": "Account created"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "error": e, "message": "Error while signing up the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# logging in user
@api_view(["POST"])
@permission_classes([AllowAny])
def user_login(request):
    data = request.data
    try:
        user = Users.objects.get(email=data['email'])
        if user.password == data["password"]:
            encoded_jwt = jwt.encode({"email": data["email"]}, os.environ.get('SECRET_KEY'), algorithm="HS256")
            # refresh = RefreshToken.for_user(user)
            # token = str(refresh.access_token)
            response = Response({"ok": True, "message": "Logged in successfully", "token": encoded_jwt}, status=status.HTTP_200_OK)
            response.set_cookie("login", encoded_jwt)
            return response
        else:
            return Response({"ok": False, "message": "Wrong Password"}, status=status.HTTP_401_UNAUTHORIZED)
    except Users.DoesNotExist as e:
        return Response({"ok": False, "message": "User doesn't exist"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"ok": False, "error": e, "message": "Error while user login"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(["POST"])
def register_event(request):
    data = request.data
    event_db = data['event_data']
    certi = data['certificate']
    try:
        Events.objects.create(organisation=data['user'], event_data=event_db, certificate=certi, coordinates=data['coords'], event_name=data['event'])
        return Response({"message": "Uploaded successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "error": e, "message": "Error while uploading events"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def faculty_register(request):
    data = request.data
    email = data["email"]
    name = data["name"]
    password = data["password"]
    organisation_code = data["organisation_code"]

    try:
        Faculty_Advisors.objects.create(email=email, name=name, password=password, organisation_code=organisation_code)
        return Response({"ok": True, "message": "Faculty registered"})
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while faculty registration"})
    
@api_view(["POST"])
def faculty_login(request):
    data = request.data
    check = Faculty_Advisors.objects.get(email=data["email"])
    try:
        if check.password == data["password"]:
            # message: {org1: [{e1: [list of rows], e2: [list of rows]}], org2: {}, ...}
            message = {}

            orgs = Faculty_Org.objects.filter(faculty=data['email'])
            
            # current faculty is related to all in this list
            organisations = []
            for i in orgs:
                org_email = i.organisation
                org_name = (Users.objects.get(email=org_email)).name
                organisations.append([i.organisation, org_name])
            
            for i in organisations:
                tmp = []
                events_of_org = Events.objects.filter(organisation=i[0])
                for any_event in events_of_org:
                    students = pd.read_excel(any_event.event_data)
                    students = students.to_dict(orient='records')
                    tmp.append({any_event.event_name: students})
                message[i[1]] = tmp

            encoded_jwt = jwt.encode({"email": data["email"]}, os.environ.get('SECRET_KEY'), algorithm="HS256")
            return Response({"ok": True, "message": message, 'token': encoded_jwt})
        else:
            return Response({"ok": False, "message": "Wrong Password"})
    except Faculty_Advisors.DoesNotExist as e:
        return Response({"ok": False, "message": "Faculty doesn't exist"})
    except Exception as e:
        return Response({"ok": False, "error": e, "message": "Error while faculty login"})
    

@api_view(["POST"])
def approveL0(request):
    data = request.data
    faculty_sign_image = data['faculty_sign']

    # image_data = base64.b64decode(base64_image)
    # image_array = np.frombuffer(image_data, np.uint8)
    # img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    org_email = Users.objects.get(name=data['organisation']).email
    event_details = Events.objects.get(event_name=data['event_name'], organisation=org_email)
    coords = event_details.coordinates
    certificate = event_details.certificate
    coords = json.loads(coords)

    del data['organisation']
    del data['event_name']
    del data['faculty_sign']

    img = Image.open(certificate)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("DejaVuSans.ttf", size=60)

    signatures = []
    for i in data.keys():
        text_to_put = data[i]
        coordinate = coords[i]
        text_color = (0, 0, 0)
        draw.text((coordinate['x'], coordinate['y']), str(text_to_put), fill=text_color, font=font,)
    
    faculty_sign_image = Image.open('/backend/main/thresh_sign.png')
    fac_sign_x = coords['faculty_sign']['x']
    fac_sign_y = coords['faculty_sign']['y']
    paste_box = (int(fac_sign_x), int(fac_sign_y), int(fac_sign_x + faculty_sign_image.width), int(fac_sign_y + faculty_sign_image.height))

    background = img.convert("RGBA")
    background.paste(faculty_sign_image, paste_box, faculty_sign_image) 
    background.save("certi.png", format="png")
    # img.paste(faculty_sign_image, paste_box)
    # img.save("/backend/main/results.png")

    return Response({"ok": True})

@api_view(["POST"])
def get_rows(request):
    data = request.data
    if 'file' not in request.FILES:
        return Response({"ok": False, "message": "Please provide an excel file"})
    
    try:
        uploaded_file = request.FILES['file']
        df = pd.read_excel(uploaded_file)
        header_rows = df.columns.tolist()
        return Response({"message": header_rows}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "error": e, "message": "Error while uploading events"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)