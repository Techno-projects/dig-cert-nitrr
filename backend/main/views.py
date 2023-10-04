from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserLoginSerializer
import jwt
import datetime
from dotenv import load_dotenv
import os

load_dotenv()
secret_key = os.environ.get('JWT_KEY')

# registering user
@api_view(["POST"])
@permission_classes([AllowAny])
def user_registration(request):
    if request.method == "POST":
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.create(
                username=serializer.validated_data["email"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
            )
            return Response(
                {
                    "message": "User registered successfully",
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# logging in user

@api_view(["POST"])
@permission_classes([AllowAny])
def user_login(request):
    if request.method == "POST":
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            payload = {
				"user": email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
			}
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            try:
                user = User.objects.get(email=email)
                if user.password == password:
                    refresh = RefreshToken.for_user(user)
                    response = Response(
                        {
                            "ok": True,
                            "message": "User logged in successfully",
                        },
                        status=status.HTTP_200_OK,
                    )
                    response.set_cookie("login", token, max_age=3600)
                    return response
                else:
                    return Response(
                        {
                            "ok": False,
                            "message": "Invalid login credentials"
						},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

            except User.DoesNotExist:
                return Response(
                    {"ok": False, "message": "User not found"}, status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def decode_user(request):
    token = request.COOKIES.get('login')
    payload = jwt.decode(token, secret_key, algorithms=['HS256'])
    response = Response({
        "ok": True,
        "message": payload
	})
    return response