# /// script
# requires-python = ">=3.11"
# dependencies = ["anthropic>=0.40"]
# ///
import json
import os
from pathlib import Path

import anthropic

inputs = json.loads(os.environ["INPUTS"])
question = Path(inputs["question.txt"]).read_text().strip()

client = anthropic.Anthropic()
message = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=256,
    messages=[{"role": "user", "content": question}],
)
print(message.content[0].text)
