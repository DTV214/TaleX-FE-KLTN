import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="glass-panel p-12 rounded-2xl text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          TaleX Workspace
        </h1>
        <p className="mt-4 text-muted-foreground">
          Frontend architecture initialized. Ready for development.
        </p>
      </div>
    </main>
  );
}
