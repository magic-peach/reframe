import VideoEditor from "@/components/VideoEditor";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>

      <main id="main-content" tabIndex={-1}>
        <VideoEditor />
      </main>

      <Footer />
    </>
  );
}
