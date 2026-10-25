"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="access-page wrap"><h1>A small interruption.</h1><p>The portfolio couldn’t load. Please try again in a moment.</p><button className="primary-button" onClick={reset}>Try again</button></main>; }
