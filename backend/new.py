def approve(data):
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
    event_name = data['Event']
    org_name = data['Organisation']
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

    recipient_email = ""
    for i in data.keys():
      text_to_put = data[i]
      coordinate = coords.get(i, None)
      recipient_email = data.get('email', '')
      if recipient_email == '':
        recipient_email = data.get('Email', '')
      if not coordinate:
        continue
      text_color = (0, 0, 0)
      font = ImageFont.truetype("DejaVuSans.ttf", size=max_font_size)
      x = coordinate['x'] + (125 / 2)
      y = coordinate['y'] + (25 / 2)
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
    print(file_extension)
    img.save(f"/backend/signed_certificates/{output_filename}", format=file_extension[1:])

    if certi_exists:
      fac_ids = Certificate.objects.get(serial_no=serial_no).faculty_advisor
      fac_ids = json.loads(fac_ids)
      fac_ids.append(current_fac_email)
      fac_ids = json.dumps(fac_ids)
      Certificate.objects.filter(serial_no=serial_no).update(faculty_advisor=fac_ids)
      if recipient_email != '':
        send_certi_email(
            recipient_email,
            current_fac_email,
            serial_no.replace(
                "/",
                '_'),
            event_name,
            org_name)
    else:
      Certificate.objects.create(
          faculty_advisor=json.dumps(
              [fac_signed_in]),
          serial_no=serial_no,
          status=certi_status,
          certificate_path=f"/backend/signed_certificates/{output_filename}")

      if recipient_email != '':
        send_certi_email(
            recipient_email,
            current_fac_email,
            serial_no.replace(
                "/",
                '_'),
            event_name,
            org_name)

    return Response({"ok": True, "message": "Signed"}, status=status.HTTP_200_OK)
  except Exception as e:
    return Response({"ok": False, "message": "Error while creating certificate",
                    "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
