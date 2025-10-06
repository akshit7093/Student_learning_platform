
import json
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
import os

DATA_PATH = "data/final_cleaned_student_data.json"
DB_PATH = "vector_store"

def create_vector_db():
    """Reads the cleaned student data and builds a FAISS vector store."""
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        student_data = json.load(f)

    print("Preparing documents for vectorization...")
    documents = []
    for enroll_no, data in student_data.items():
        name = data.get("name")
        
        # Create a document for each major section of the student's profile
        if data.get("academic_profile"):
            documents.append(Document(
                page_content=json.dumps(data["academic_profile"]),
                metadata={"enrollment_no": enroll_no, "student_name": name, "data_source": "academics"}
            ))
        
        if data.get("coding_profiles", {}).get("leetcode"):
            documents.append(Document(
                page_content=json.dumps(data["coding_profiles"]["leetcode"]),
                metadata={"enrollment_no": enroll_no, "student_name": name, "data_source": "leetcode"}
            ))

        if data.get("coding_profiles", {}).get("github"):
            documents.append(Document(
                page_content=json.dumps(data["coding_profiles"]["github"]),
                metadata={"enrollment_no": enroll_no, "student_name": name, "data_source": "github"}
            ))

        if data.get("coding_profiles", {}).get("codeforces"):
            documents.append(Document(
                page_content=json.dumps(data["coding_profiles"]["codeforces"]),
                metadata={"enrollment_no": enroll_no, "student_name": name, "data_source": "codeforces"}
            ))

    print(f"Created {len(documents)} documents.")

    # Use a standard, high-performance embedding model
    embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')

    print("Creating FAISS vector store...")
    db = FAISS.from_documents(documents, embeddings)
    
    # Save the vector store locally
    if not os.path.exists(DB_PATH):
        os.makedirs(DB_PATH)
    db.save_local(DB_PATH)
    
    print(f"✅ Vector store created and saved at '{DB_PATH}'")

if __name__ == "__main__":
    create_vector_db()