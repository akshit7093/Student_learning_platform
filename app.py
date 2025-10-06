# main.py
from rag_system import StudentApiRAG # <-- CHANGED IMPORT
import json

def display_help():
    print("\n--- Student Analyzer Chatbot ---")
    print("Commands:")
    print("  select <enrollment_no>   - Select a student profile to analyze.")
    print("  report                   - Generate a full, structured performance report for the selected student.")
    print("  ask <your_question>      - Ask a specific question about the selected student.")
    print("  whoami                   - Show the currently selected student.")
    print("  help                     - Show this help message.")
    print("  exit                     - Exit the application.")
    print("---------------------------------")

def main():
    rag_system = StudentApiRAG() # <-- CHANGED CLASS NAME
    current_student = None
    student_name = ""

    display_help()

    while True:
        if current_student:
            prompt = f"({student_name}) > "
        else:
            prompt = "> "
            
        user_input = input(prompt).strip()

        if user_input.lower() == 'exit':
            break
        elif user_input.lower() == 'help':
            display_help()
            continue
        elif user_input.lower() == 'whoami':
            if current_student:
                print(f"Currently analyzing: {student_name} ({current_student})")
            else:
                print("No student selected. Use 'select <enrollment_no>'.")
            continue

        if user_input.lower().startswith('select '):
            parts = user_input.split()
            if len(parts) == 2:
                current_student = parts[1]
                # Load the name from the in-memory data
                student_profile = rag_system.student_data.get(current_student, {})
                student_name = student_profile.get("name", "Unknown")
                if student_name != "Unknown":
                    print(f"Selected student: {student_name} ({current_student})")
                else:
                    print(f"Warning: Could not find student with enrollment no '{current_student}'.")
                    current_student = None
            else:
                print("Invalid command. Usage: select <enrollment_no>")
            continue

        if not current_student:
            print("Please select a student first using 'select <enrollment_no>'.")
            continue

        if user_input.lower() == 'report':
            report = rag_system.generate_structured_report(current_student)
            print("\n--- Generating Full Performance Report ---")
            print(json.dumps(report, indent=2))
            print("----------------------------------------\n")
        
        elif user_input.lower().startswith('ask '):
            question = user_input[4:].strip()
            if question:
                answer = rag_system.answer_question(question, current_student)
                print(f"\nAI: {answer}\n")
            else:
                print("Please provide a question after 'ask'.")
        else:
            print("Invalid command. Type 'help' to see the available commands.")

if __name__ == "__main__":
    main()