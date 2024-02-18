import cv2

img = cv2.imread("sign.jpeg")
gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
ret,thresh = cv2.threshold(gray_img, 0, 255, cv2.THRESH_OTSU)
cv2.imwrite("thresh_sign.jpeg", thresh)
