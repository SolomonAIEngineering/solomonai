"use client";

import { useState } from "react";
import { useEnterSubmit } from "@/hooks/use-enter-submit";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Textarea } from "@midday/ui/textarea";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";

import { ChatEmpty } from "./chat-empty";
import { ChatExamples } from "./chat-examples";
import { ChatList } from "./chat-list";
import { chatExamples } from "./examples";
import { Footer } from "./footer";
import { BotCard, SignUpCard, UserMessage } from "./messages";

export function Chat({ messages, submitMessage, onNewChat, input, setInput }) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const [isVisible, setVisible] = useState(false);

  const onSubmit = (input: string) => {
    const value = input.trim();

    if (value.length === 0) {
      return null;
    }

    setInput("");

    submitMessage((message) => [
      ...message,
      {
        id: nanoid(),
        role: "user",
        display: <UserMessage>{value}</UserMessage>,
      },
    ]);

    const content = chatExamples.find(
      (example) => example.title === input,
    )?.content;

    if (content) {
      setTimeout(
        () =>
          submitMessage((message) => [
            ...message,
            {
              id: nanoid(),
              role: "assistant",
              display: (
                <BotCard
                  content={
                    chatExamples.find((example) => example.title === input)
                      ?.content
                  }
                />
              ),
            },
          ]),
        500,
      );
    } else {
      setTimeout(
        () =>
          submitMessage((message) => [
            ...message,
            {
              id: nanoid(),
              role: "assistant",
              display: <SignUpCard />,
            },
          ]),
        200,
      );
    }
  };

  const showExamples = isVisible && messages.length === 0 && !input;

  return (
    <div className="relative h-[420px]">
      <ScrollArea className="h-[335px]">
        {messages.length ? <ChatList messages={messages} /> : <ChatEmpty />}
      </ScrollArea>

      <div className="absolute bottom-[1px] left-[1px] right-[1px] h-[88px] border-t-[1px] border-border">
        {showExamples && <ChatExamples onSubmit={onSubmit} />}

        <form
          ref={formRef}
          onSubmit={(evt) => {
            evt.preventDefault();
            onSubmit(input);
          }}
        >
          <Textarea
            tabIndex={0}
            rows={1}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            value={input}
            className="h-12 min-h-12 resize-none border-none pt-3"
            placeholder="Ask Solomon a question..."
            onKeyDown={onKeyDown}
            onChange={(evt) => {
              setInput(evt.target.value);
            }}
          />
        </form>

        <motion.div
          onViewportEnter={() => {
            if (!isVisible) {
              setVisible(true);
            }
          }}
          onViewportLeave={() => {
            if (isVisible) {
              setVisible(false);
            }
          }}
        >
          <Footer onSubmit={() => onSubmit(input)} />
        </motion.div>
      </div>
    </div>
  );
}
