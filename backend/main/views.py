import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
# from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .models import Events, Faculty_Advisors, Users
import json
import jwt
import os
from dotenv import load_dotenv

load_dotenv()
jwt_auth = JWTStatelessUserAuthentication()

# registering user
@api_view(["POST"])
@permission_classes([AllowAny])
def user_register(request):
    data = request.data
    try:
        Users.objects.create(email=data["email"], password=data["password"], organisation_code=data["organisation_code"])
        return Response({"ok": True, "message": "Account created"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while signing up the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# logging in user
@api_view(["POST"])
@permission_classes([AllowAny])
def user_login(request):
    data = request.data
    try:
        user = Users.objects.get(organisation_code=data["organisation_code"])
        if user.password == data["password"]:
            refresh = RefreshToken.for_user(user)
            token = str(refresh.access_token)

            # decodedToken = jwt.decode(token, os.environ.get('SECRET_KEY'), algorithms=['HS256'])
            # print(decodedToken)

            response = Response({"ok": True, "message": "Logged in successfully"}, status=status.HTTP_200_OK)
            response.set_cookie("login", token)
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
    if 'file' not in request.FILES:
        return Response({"ok": False, "message": "Please provide an excel file"})
    
    try:
        uploaded_file = request.FILES['file']
        df = pd.read_excel(uploaded_file)
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while reading excel file"})
    
    try:
        event_name = data['event_name']
        event_data = df.to_json(orient='records')
        event_data_str = json.dumps(event_data)
        organisation_code = data['organisation_code']

        Events.objects.create(event_name=event_name, event_data=event_data_str, organisation_code=organisation_code)
        return Response({"event": event_name, "message": "Uploaded successfully"})


    except Exception as e:
        return Response({"ok": False, "error": e, "message": "Error while uploading the data"})
    

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
            org_code = check.organisation_code

            events = Events.objects.all()
            org_events = events.filter(organisation_code=org_code)
            
            message = {"organisation_code": check.organisation_code}
            events = []
            for i in org_events:
                events.append({"event_name": i.event_name, "data": i.event_data})
            message["events"] = events

            return Response({"ok": True, "message": message})
        else:
            return Response({"ok": False, "message": "Wrong Password"})
    except Faculty_Advisors.DoesNotExist as e:
        return Response({"ok": False, "message": "Faculty doesn't exist"})
    except Exception as e:
        return Response({"ok": False, "error": str(e), "message": "Error while faculty login"})