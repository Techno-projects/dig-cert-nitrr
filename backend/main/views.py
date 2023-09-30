from django.shortcuts import render
from django.http import HttpResponse

def test(request):
  print("HELLOii")
  response = HttpResponse("Hi, I am backend, the most powerful.")
  return response