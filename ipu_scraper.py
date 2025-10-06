import requests
import base64
import json
from Crypto.Cipher import AES
from typing import Dict, Optional
import hashlib

class StudentScraper:
    def __init__(self, encryption_key: Optional[str] = None):
        # Hardcoded encryption key, no config import needed!
        self.encryption_key = encryption_key or "Qm9sRG9OYVphcmEK"
        self.base_url = "https://api.ipuranklist.com/api/student"
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }

    def get_student_data(self, roll_no: str) -> Dict:
        """
        Get student data from IPU Rank List API using roll number.
        Args:
            roll_no (str): Student roll number
        Returns:
            Dict: Processed and cleaned student information
        """
        try:
            encrypted_data = self._fetch_student_data(roll_no)
            decrypted_data = self._decrypt_response(encrypted_data)
            processed_data = self._preprocess_student_data(decrypted_data)
            return processed_data
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch data from IPU API: {str(e)}")
        except ValueError as e:
            raise Exception(f"Invalid input or data format: {str(e)}")
        except Exception as e:
            raise Exception(f"An error occurred while getting student data: {str(e)}")

    def _fetch_student_data(self, enroll_no: str) -> str:
        """Fetch encrypted student data from the API."""
        url = f"{self.base_url}?enroll={enroll_no}"
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            if response.status_code == 404:
                raise Exception("Student not found. Please check the roll number.")
            elif response.status_code == 403:
                raise Exception("Access forbidden. API may require authentication.")
            elif response.status_code == 429:
                raise Exception("Rate limit exceeded. Please try again later.")
            elif response.status_code == 500:
                raise Exception("Server error. Please try again later.")
            response.raise_for_status()
            return response.text.strip()
        except requests.exceptions.Timeout:
            raise Exception("Request timeout. Please try again.")
        except requests.exceptions.ConnectionError:
            raise Exception("Connection error. Please check your internet connection.")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

    def _decrypt_response(self, encrypted_data: str) -> Dict:
        """
        Decrypt the encrypted response using OpenSSL EVP format.
        """
        if not self.encryption_key:
            raise Exception(
                "Encryption key not provided. Please set IPU_ENCRYPTION_KEY in StudentScraper."
            )
        try:
            # Decode base64
            data = base64.b64decode(encrypted_data)
            # Check if it starts with "Salted__" (OpenSSL EVP format)
            if data[:8] != b"Salted__":
                raise ValueError("Not in OpenSSL EVP format")
            # Extract salt (next 8 bytes after "Salted__")
            salt = data[8:16]
            ciphertext = data[16:]
            # Derive key and IV using OpenSSL's EVP_BytesToKey method (MD5 based)
            key_iv = b""
            prev = b""
            while len(key_iv) < 48:  # 32 bytes key + 16 bytes IV
                prev = hashlib.md5(prev + self.encryption_key.encode("utf-8") + salt).digest()
                key_iv += prev
            key = key_iv[:32]
            iv = key_iv[32:48]
            # Decrypt using AES-256-CBC
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted = cipher.decrypt(ciphertext)
            # Remove PKCS7 padding
            padding_len = decrypted[-1]
            if isinstance(padding_len, str):
                padding_len = ord(padding_len)
            decrypted = decrypted[:-padding_len]
            # Parse JSON
            decrypted_json = json.loads(decrypted.decode("utf-8"))
            return decrypted_json
        except Exception as e:
            raise Exception(f"Failed to decrypt response: {str(e)}")

    def _preprocess_student_data(self, raw_data: Dict) -> Dict:
        """
        Preprocess student data to ensure subject names are present.
        This version preserves all original fields from the API response.
        """
        try:
            if "data" not in raw_data or "metadata" not in raw_data:
                return raw_data

            data = raw_data["data"]
            metadata = raw_data["metadata"]

            # Create a mapping of subject IDs to names from the metadata.
            subject_mapping = {
                subject["_id"]: {"name": subject["name"], "credit": subject["credit"]}
                for subject in metadata.get("subjects", [])
            }

            if "results" in data:
                for result in data["results"]:
                    if "subject_results" in result:
                        for subject_result in result["subject_results"]:
                            # If subject_name is already present, do nothing.
                            if subject_result.get("subject_name"):
                                continue

                            # If missing, try to map it using subject_id.
                            subject_id = subject_result.get("subject_id")
                            if subject_id in subject_mapping:
                                subject_info = subject_mapping[subject_id]
                                subject_result["subject_name"] = subject_info.get("name", "Unknown Subject")
                                if "credit" not in subject_result:
                                    subject_result["credit"] = subject_info.get("credit")

            processed_data = {
                "status": "success",
                "student_info": {
                    "enroll_no": data.get("enroll_no"),
                    "name": data.get("name"),
                    "img": data.get("img"),
                },
                "academic_summary": {
                    "overall_performance": {
                        "total_marks": data.get("total_marks"),
                        "max_marks": data.get("max_marks"),
                        "total_credits": data.get("total_credits"),
                        "max_credits": data.get("max_credits"),
                        "percentage": data.get("percentage"),
                        "credit_percentage": data.get("credit_percentage"),
                        "cgpa": data.get("cgpa"),
                    },
                    "semester_results": data.get("results", []),
                },
                "programme_info": {
                    "course": metadata.get("programmeData", {}).get("course", {}),
                    "branch": metadata.get("programmeData", {}).get("branch", {}),
                    "institute": metadata.get("instituteData", {}),
                },
            }
            return processed_data
        except Exception:
            return raw_data

    def validate_roll_number(self, roll_no: str) -> bool:
        """Validate roll number format."""
        if not roll_no or not isinstance(roll_no, str):
            return False
        cleaned = "".join(filter(str.isalnum, roll_no))
        if len(cleaned) < 8 or len(cleaned) > 15:
            return False
        return True

    def get_multiple_students(self, roll_numbers: list) -> Dict:
        """Get data for multiple students."""
        results = {
            "total_requested": len(roll_numbers),
            "successful": 0,
            "failed": 0,
            "students": [],
            "errors": [],
        }
        for roll_no in roll_numbers:
            try:
                student_data = self.get_student_data(roll_no)
                results["students"].append(student_data)
                results["successful"] += 1
            except Exception as e:
                results["errors"].append({"roll_number": roll_no, "error": str(e)})
                results["failed"] += 1
        return results

# Example usage:
if __name__ == "__main__":
    # No config file needed
    scraper = StudentScraper(encryption_key="Qm9sRG9OYVphcmEK")
    roll_no = "35214811922"
    try:
        data = scraper.get_student_data(roll_no)
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}")
