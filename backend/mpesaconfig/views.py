# views.py
import requests, base64, json, re, os
from datetime import datetime
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Transaction
from .serializers import TransactionSerializer, PaymentSerializer, STKQuerySerializer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Retrieve variables from the environment
CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
MPESA_PASSKEY = os.getenv("MPESA_PASSKEY")
MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE")
CALLBACK_URL = os.getenv("MPESA_CALLBACK_BASE_URL")
MPESA_BASE_URL = os.getenv("MPESA_BASE_URL")

class MPesaViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def get_permissions(self):
        if self.action == 'callback':
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]  # Or whatever permissions you normally use
        return [permission() for permission in permission_classes]

    # Phone number formatting and validation
    def format_phone_number(self, phone):
        phone = phone.replace("+", "")
        if re.match(r"^254\d{9}$", phone):
            return phone
        elif phone.startswith("0") and len(phone) == 10:
            return "254" + phone[1:]
        else:
            raise ValueError("Invalid phone number format")

    # Generate M-Pesa access token
    def generate_access_token(self):
        try:
            credentials = f"{CONSUMER_KEY}:{CONSUMER_SECRET}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()

            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/json",
            }
            response = requests.get(
                f"{MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
                headers=headers,
            ).json()

            if "access_token" in response:
                return response["access_token"]
            else:
                raise Exception("Access token missing in response.")

        except requests.RequestException as e:
            raise Exception(f"Failed to connect to M-Pesa: {str(e)}")

    # Initiate STK Push and handle response
    def initiate_stk_push(self, phone, amount):
        try:
            token = self.generate_access_token()
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            stk_password = base64.b64encode(
                (MPESA_SHORTCODE + MPESA_PASSKEY + timestamp).encode()
            ).decode()

            request_body = {
                "BusinessShortCode": MPESA_SHORTCODE,
                "Password": stk_password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": float(amount),  # Convert Decimal to float
                "PartyA": phone,
                "PartyB": MPESA_SHORTCODE,
                "PhoneNumber": phone,
                "CallBackURL": CALLBACK_URL,
                "AccountReference": "account",
                "TransactionDesc": "Payment for goods",
            }

            response = requests.post(
                f"{MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest",
                json=request_body,
                headers=headers,
            ).json()

            return response

        except Exception as e:
            print(f"Failed to initiate STK Push: {str(e)}")
            return {"error": str(e)}

    # Query STK Push status
    def query_stk_push(self, checkout_request_id):
        try:
            token = self.generate_access_token()
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(
                (MPESA_SHORTCODE + MPESA_PASSKEY + timestamp).encode()
            ).decode()

            request_body = {
                "BusinessShortCode": MPESA_SHORTCODE,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }

            response = requests.post(
                f"{MPESA_BASE_URL}/mpesa/stkpushquery/v1/query",
                json=request_body,
                headers=headers,
            )
            return response.json()

        except requests.RequestException as e:
            return {"error": str(e)}

    @action(detail=False, methods=['post'])
    def initiate_payment(self, request):
        print("Received payload:", request.data)  # Add logging
        serializer = PaymentSerializer(data=request.data)
        if serializer.is_valid():
            try:
                phone = self.format_phone_number(serializer.validated_data["phone_number"])
                amount = serializer.validated_data["amount"]
                response = self.initiate_stk_push(phone, amount)

                if response.get("ResponseCode") == "0":
                    checkout_request_id = response["CheckoutRequestID"]
                    return Response({
                        "success": True,
                        "message": "STK push initiated successfully",
                        "checkout_request_id": checkout_request_id
                    }, status=status.HTTP_200_OK)
                else:
                    error_message = response.get("errorMessage", "Failed to send STK push. Please try again.")
                    return Response({
                        "success": False,
                        "message": error_message
                    }, status=status.HTTP_400_BAD_REQUEST)

            except ValueError as e:
                return Response({
                    "success": False,
                    "message": str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({
                    "success": False,
                    "message": f"An unexpected error occurred: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print("Validation errors:", serializer.errors)  # Add logging
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def query_status(self, request):
        serializer = STKQuerySerializer(data=request.data)
        if serializer.is_valid():
            checkout_request_id = serializer.validated_data['checkout_request_id']
            status_response = self.query_stk_push(checkout_request_id)
            return Response({"status": status_response})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    @csrf_exempt
    def callback(self, request):
        try:

            # Try to access raw data
            try:
                body = request.body.decode('utf-8')
                print("Raw request body:", body)
                if body:
                    import json
                    data = json.loads(body)
                    print("Parsed JSON data:", data)
                else:
                    print("Request body is empty")
            except Exception as e:
                print(f"Error parsing request body: {str(e)}")
            print("Callback data received:", request.data)  # Debug log
            callback_data = request.data

            # Detailed debugging
            if isinstance(callback_data, dict):
                print("Keys in payload:", callback_data.keys())
            else:
                print("Payload is not a dictionary, it's a:", type(callback_data))
            
            # Handle different potential data structures
            if "Body" in callback_data:
                # Standard M-Pesa format
                stk_callback = callback_data["Body"]["stkCallback"]
            elif "stkCallback" in callback_data:
                # Alternative format without Body wrapper
                stk_callback = callback_data["stkCallback"]
            else:
                return Response({"error": "Invalid data format: Missing required keys"}, 
                            status=status.HTTP_400_BAD_REQUEST)
                
            result_code = stk_callback["ResultCode"]
            
            if result_code == 0:
                # Successful transaction
                checkout_id = stk_callback["CheckoutRequestID"]
                metadata = stk_callback["CallbackMetadata"]["Item"]

                amount = next(item["Value"] for item in metadata if item["Name"] == "Amount")
                mpesa_code = next(item["Value"] for item in metadata if item["Name"] == "MpesaReceiptNumber")
                phone = next(item["Value"] for item in metadata if item["Name"] == "PhoneNumber")

                # Save transaction to the database
                Transaction.objects.create(
                    amount=amount, 
                    checkout_id=checkout_id, 
                    mpesa_code=mpesa_code, 
                    phone_number=phone, 
                    status="Success"
                )
                return Response({"ResultCode": 0, "ResultDesc": "Payment successful"})

            # Payment failed
            return Response({"ResultCode": result_code, "ResultDesc": "Payment failed"})

        except (KeyError, json.JSONDecodeError) as e:
            return Response({"error": f"Invalid request data: {str(e)}"}, 
                           status=status.HTTP_400_BAD_REQUEST)