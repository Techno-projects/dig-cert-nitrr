from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserLoginSerializer


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
            # generate refresh tokens for user while registration
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "User registered successfully",
                    "token": str(refresh.access_token),
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
            try:
                user = User.objects.get(email=email)
                if user.password == password:
                    refresh = RefreshToken.for_user(user)
                    return Response(
                        {
                            "message": "User logged in successfully",
                            "token": str(refresh.access_token),
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"message": "Invalid login credentials"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

            except User.DoesNotExist:
                return Response(
                    {"message": "User not found"}, status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

