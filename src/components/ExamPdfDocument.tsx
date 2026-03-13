import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Exam, ExamVersion, Question, SubQuestion } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";

// Register Arabic font
Font.register({
  family: "IBM Plex Arabic",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3CZRtWPQCuHme67tEYUIx3Kh0PHR9N6bs61A.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3NZRtWPQCuHme67tEYUIx3Kh0PHR9N6bs61C_dSQ.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "IBM Plex Arabic",
    fontSize: 11,
    direction: "rtl",
    lineHeight: 1.8,
  },
  header: {
    borderBottom: "2px solid #333",
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerText: {
    fontSize: 10,
    color: "#333",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#555",
  },
  question: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111",
  },
  questionType: {
    fontSize: 9,
    color: "#666",
  },
  instructions: {
    fontSize: 9,
    color: "#888",
    marginBottom: 4,
    fontStyle: "italic",
  },
  subQuestion: {
    flexDirection: "row-reverse",
    marginBottom: 6,
    paddingRight: 16,
    gap: 6,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#333",
    minWidth: 16,
  },
  subContent: {
    flex: 1,
  },
  contentText: {
    fontSize: 10,
    color: "#222",
    lineHeight: 1.7,
  },
  mcqOption: {
    flexDirection: "row-reverse",
    marginTop: 3,
    paddingRight: 8,
    gap: 6,
  },
  mcqLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#555",
    minWidth: 14,
  },
  mcqText: {
    fontSize: 9,
    color: "#333",
  },
  answerLine: {
    borderBottom: "1px dotted #ccc",
    height: 20,
    marginTop: 4,
  },
  versionLabel: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    color: "#666",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
  },
});

interface ExamPdfDocumentProps {
  exam: Exam;
  version: ExamVersion;
  showAnswerKey?: boolean;
}

function QuestionBlock({ question }: { question: Question }) {
  return (
    <View style={styles.question}>
      {/* Question header */}
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>
          السؤال {question.questionNumber}:
        </Text>
        <Text style={styles.questionType}>
          ({QUESTION_TYPE_LABELS[question.type]})
        </Text>
      </View>

      {question.instructions && (
        <Text style={styles.instructions}>{question.instructions}</Text>
      )}

      {/* Sub-questions */}
      {question.subQuestions.map((sub) => (
        <SubQuestionBlock key={sub.id} sub={sub} />
      ))}
    </View>
  );
}

function SubQuestionBlock({ sub }: { sub: SubQuestion }) {
  return (
    <View style={styles.subQuestion}>
      <Text style={styles.subLabel}>{sub.label})</Text>
      <View style={styles.subContent}>
        <Text style={styles.contentText}>
          {sub.contentText || "___________________________"}
        </Text>

        {/* MCQ options */}
        {sub.type === "mcq" && sub.mcqOptions && (
          <View>
            {sub.mcqOptions.map((opt) => (
              <View key={opt.id} style={styles.mcqOption}>
                <Text style={styles.mcqLabel}>{opt.label})</Text>
                <Text style={styles.mcqText}>
                  {opt.text || "________________"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Answer lines for non-MCQ */}
        {sub.type !== "mcq" && sub.type !== "drawing" && (
          <>
            <View style={styles.answerLine} />
            <View style={styles.answerLine} />
          </>
        )}

        {/* Drawing box */}
        {sub.type === "drawing" && (
          <View
            style={{
              border: "1px solid #ddd",
              height: 120,
              marginTop: 6,
              borderRadius: 4,
            }}
          />
        )}
      </View>
    </View>
  );
}

export function ExamPdfDocument({ exam, version, showAnswerKey = false }: ExamPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>
              {exam.metadata.schoolName || "اسم المدرسة"}
            </Text>
            <Text style={styles.headerText}>
              {exam.metadata.date || "التاريخ"}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>
              المادة: {exam.metadata.subject || "___"}
            </Text>
            <Text style={styles.headerText}>
              المدة: {exam.metadata.duration || "___"}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{exam.title}</Text>
          <Text style={styles.headerSubtitle}>
            نموذج ({version.label})
            {exam.metadata.totalMarks ? ` — الدرجة الكلية: ${exam.metadata.totalMarks}` : ""}
          </Text>
        </View>

        {/* Questions */}
        {version.questions.map((q) => (
          <QuestionBlock key={q.id} question={q} />
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          تم إنشاء هذا الامتحان بواسطة AKONY — صانع الامتحانات الذكي
        </Text>
      </Page>

      {/* Answer Key Page (optional) */}
      {showAnswerKey && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.headerTitle, { marginBottom: 20 }]}>
            مفتاح الإجابة — نموذج ({version.label})
          </Text>
          {version.questions.map((q) => (
            <View key={q.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", marginBottom: 6, gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>
                  السؤال {q.questionNumber}:
                </Text>
                <Text style={{ fontSize: 9, color: "#666" }}>
                  ({QUESTION_TYPE_LABELS[q.type]})
                </Text>
              </View>

              {q.subQuestions.map((sub) => (
                <View key={sub.id} style={{ flexDirection: "row-reverse", gap: 6, paddingRight: 16, marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: "#333", minWidth: 16 }}>
                    {sub.label})
                  </Text>
                  <Text style={{ fontSize: 10, color: "#222" }}>
                    {sub.type === "mcq" && sub.mcqOptions
                      ? (() => {
                          const correct = sub.mcqOptions.find((o) => o.isCorrect);
                          return correct ? `${correct.label} — ${correct.text}` : "لم يتم تحديد إجابة صحيحة";
                        })()
                      : sub.contentText?.slice(0, 80) + (sub.contentText?.length > 80 ? "..." : "") || "—"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
          <Text style={styles.footer}>
            AKONY — مفتاح الإجابة (سري)
          </Text>
        </Page>
      )}
    </Document>
  );
}
