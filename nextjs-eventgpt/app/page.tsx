"use client"
import Image from 'next/image'
import EventMasterGPTLogo from "./assets/EventMasterGPTlogo.png"
import { useChat } from "ai/react"
import { Message } from "ai"
import Bubble from './components/Bubble'
import LoadingBubble from './components/LoadingBubble'
import PromptSuggestionsRow from './components/PromptSuggestionsRow'

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()

   const noMessages = !messages || messages.length === 0

   const handlePrompt = (promptText) => {
       const msg: Message = {
        id: crypto.randomUUID(),
        content: promptText,
        role:"user",
       }
        append(msg)
   }

    return (
        <main>
            <Image src={EventMasterGPTLogo} width="250" alt="EventMasterGPT Logo"/>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The Ultimate Place for Event Planning Enthusiasts!
                            Ask EventMasterGPT anything about organizing, managing, and discovering amazing events,and it will provide you with the most up-to-date answers.
                            We hope you enjoy! 🚀
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box"onChange={handleInputChange} value={input} placeholder="Ask EventMasterGPT anything about events!"/>
                <input type="submit"/>
            </form>
        </main>
    )
}

export default Home
