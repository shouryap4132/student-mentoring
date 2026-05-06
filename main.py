import google.generativeai as genai
import os

# 1. Setup - Replace with your actual API key
os.environ["GEMINI_API_KEY"] = "AIzaSyA9pOHc3oVVax-clQKmBYrsLOOvUdBhceA"
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# 2. Define the "Socratic Mentor" Personality
SYSTEM_INSTRUCTION = """
You are a Socratic Tutor for a student working on university-level automation and Python projects. 
Your goal is to help the user learn the PROCESS, not just provide the result.

STRICT RULES:
1. NEVER provide a full code block or a final answer immediately.
2. If the user asks for code, explain the logic or the library they should use first.
3. Provide "pseudo-code" or small snippets (1-3 lines) instead of full scripts.
4. Always end your response with a specific question or a 'mini-task' for the user to try.
5. If the user is stuck on Canvas API or automation logic, explain the documentation's intent.
"""

# 3. Initialize the Model
model = genai.GenerativeModel(
    model_name="gemma-4-26b-a4b-it", # Best for the Free Tier (fast & efficient)
    system_instruction=SYSTEM_INSTRUCTION
)

# 4. Start the Chat Session (with History)
chat = model.start_chat(history=[])

def main():
    print("--- NPO Socratic Tutor Bot (Free Tier) ---")
    print("Type 'exit' to quit.\n")

    while True:
        user_input = input("Student: ")
        
        if user_input.lower() in ['exit', 'quit']:
            break

        try:
            # Send message to Gemini
            response = chat.send_message(user_input)
            
            print(f"\nMentor: {response.text}\n")
            
        except Exception as e:
            print(f"\nError: {e}")
            print("Check your API key or connection limits.")

if __name__ == "__main__":
    main()