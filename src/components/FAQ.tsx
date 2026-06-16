import { JSX } from "react";

const faqQuestions = [
    {
        question: "Is my video uploaded anywhere?",
        answer: "No, your video is not uploaded anywhere. They are processed locally on your machine."
    },{
        question:"What video formats are supported?",
        answer:"Reframe supports a wide range of video formats including MP4, MOV, AVI, and WEBM. If your video is in a different format, you can convert it to one of the supported formats using free online converters or software.",
    },
    {
        question:"Why is processing slow for large files?",
        answer:"Large videos require more memory and processing power, which may slow down processing depending on your device.",
    },
    {
        question:"Can I use this offline?",
        answer:"Once loaded, Reframe works fully offline — your browser needs to download the FFmpeg engine (~30MB) the first time, but after that no internet connection is needed.",
    }
]

const FAQ = (): JSX.Element => {
    return ( 
        <> 
            <div className="bg-[var(--surface)] rounded-xl shadow p-5 space-y-4 animate-fade-in border border-[var(--border)] transition-colors">
                <details >
                <summary className="text-xl text-[var(--text)] font-heading font-bold uppercase tracking-widest p-2 cursor-pointer rounded-md">
                    FAQ
                </summary>
                {faqQuestions.map((faq, index)=>{
                    return (
                        <details key= {index}>
                            <summary className="text-base text-[var(--text)] font-heading font-light mt-4 cursor-pointer p-2 rounded-md">
                                {faq.question}
                            </summary>
                            <p className="text-base text-[var(--text)] mt-2 ml-2 font-extralight p-2 rounded-md">
                                {faq.answer}
                            </p>
                        </details>
                    )
                })}
                </details>
            </div>
        </>
    )
}

export default FAQ;
