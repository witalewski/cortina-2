import { LessonPage } from "@/app/components/LessonPage";
import { CHORDS_101 } from "@/lib/lessons/Chords101";

export default function LessonsPage() {
  return <LessonPage lesson={CHORDS_101} />;
}