from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def test_get(request):
  return Response({"response": "Hi, I am backend, the most powerful."})

@api_view(['POST'])
def test_post(request):
  data = request.data
  return Response({"response": f"Hi, {data['name']}"})