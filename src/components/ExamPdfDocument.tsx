import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Exam, ExamVersion, Question, SubQuestion } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";

// Register Arabic font
Font.register({
  family: "Amiri",
  fonts: [
    {
      src: "/fonts/amiri-regular.ttf",
      fontWeight: 400,
    },
    {
      src: "/fonts/amiri-bold.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Amiri",
    fontSize: 10,
    direction: "rtl",
    lineHeight: 1.5,
  },
  answerKeyPage: {
    padding: 30,
    fontFamily: "Amiri",
    fontSize: 10,
    direction: "rtl",
    lineHeight: 1.5,
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
  headerLogo: {
    width: 40,
    height: 40,
    objectFit: "contain",
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
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 6,
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
  questionPoints: {
    fontSize: 9,
    color: "#666",
    fontWeight: 700,
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
    bottom: 15,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
  },
  answerKeyHeader: {
    borderBottom: "2px solid #333",
    paddingBottom: 12,
    marginBottom: 20,
  },
  answerKeyTitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
  },
  answerKeySubtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#555",
  },
  answerKeyQuestion: {
    background: "#f9f9f9",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    border: "1px solid #eee",
  },
  answerKeyQuestionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
  },
  answerKeyQuestionNumber: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111",
  },
  answerKeyQuestionType: {
    fontSize: 9,
    color: "#666",
    background: "#eee",
    padding: "2px 6px",
    borderRadius: 3,
    marginRight: 8,
  },
  answerKeyQuestionPoints: {
    fontSize: 9,
    color: "#666",
    fontWeight: 700,
  },
  answerKeySubAnswer: {
    flexDirection: "row-reverse",
    paddingRight: 8,
    marginBottom: 4,
  },
  answerKeySubLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#333",
    minWidth: 18,
  },
  answerKeyContent: {
    fontSize: 10,
    color: "#222",
    flex: 1,
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
        <Text style={[styles.questionType, { marginRight: 6 }]}>
          ({QUESTION_TYPE_LABELS[question.type]})
        </Text>
        {question.points !== undefined && (
          <Text style={[styles.questionPoints, { marginRight: 6 }]}>
            (درجة: {question.points})
          </Text>
        )}
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
      <Text style={[styles.subLabel, { marginLeft: 6 }]}>{sub.label})</Text>
      <View style={styles.subContent}>
        <Text style={styles.contentText}>
          {sub.contentText || "___________________________"}
        </Text>

        {/* MCQ options */}
        {sub.type === "mcq" && sub.mcqOptions && (
          <View>
            {sub.mcqOptions.map((opt) => (
              <View key={opt.id} style={styles.mcqOption}>
                <Text style={[styles.mcqLabel, { marginLeft: 6 }]}>{opt.label})</Text>
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

function calculateTotalMarks(version: ExamVersion, metadataTotalMarks?: number): number {
  const questionPointsSum = version.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  return questionPointsSum > 0 ? questionPointsSum : (metadataTotalMarks || 0);
}

export function ExamPdfDocument({ exam, version, showAnswerKey = false }: ExamPdfDocumentProps) {
  const totalMarks = calculateTotalMarks(version, exam.metadata.totalMarks);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {exam.metadata.logoUrl && (
              <Image src={exam.metadata.logoUrl} style={styles.headerLogo} />
            )}
            <Text style={styles.headerText}>
              {exam.metadata.date || "التاريخ"}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>
              {exam.metadata.schoolName || "اسم المدرسة"}
            </Text>
            <Text style={styles.headerText}>
              المادة: {exam.metadata.subject || "___"}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerText} />
            <Text style={styles.headerText}>
              المدة: {exam.metadata.duration || "___"}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{exam.title}</Text>
          <Text style={styles.headerSubtitle}>
            نموذج ({version.label})
            {totalMarks > 0 ? ` — الدرجة الكلية: ${totalMarks}` : ""}
          </Text>
        </View>

        {/* Questions */}
        {version.questions.map((q) => (
          <QuestionBlock key={q.id} question={q} />
        ))}

      </Page>

      {/* Answer Key Page (optional) */}
      {showAnswerKey && (
        <Page size="A4" style={styles.answerKeyPage} wrap={false}>
          <View style={styles.answerKeyHeader}>
            <Text style={styles.answerKeyTitle}>
              مفتاح الإجابة
            </Text>
            <Text style={styles.answerKeySubtitle}>
              {exam.title} — نموذج ({version.label})
            </Text>
          </View>

          {version.questions.map((q) => (
            <View key={q.id} style={styles.answerKeyQuestion}>
              <View style={styles.answerKeyQuestionHeader}>
                <Text style={styles.answerKeyQuestionNumber}>
                  السؤال {q.questionNumber}
                </Text>
                <Text style={styles.answerKeyQuestionType}>
                  {QUESTION_TYPE_LABELS[q.type]}
                </Text>
                {q.points !== undefined && (
                  <Text style={[styles.answerKeyQuestionPoints, { marginRight: 8 }]}>
                    (درجة: {q.points})
                  </Text>
                )}
              </View>

              <View>
                {q.subQuestions.map((sub) => (
                  <View key={sub.id} style={styles.answerKeySubAnswer}>
                    <Text style={styles.answerKeySubLabel}>
                      {sub.label})
                    </Text>
                    <Text style={styles.answerKeyContent}>
                      {sub.type === "mcq" && sub.mcqOptions
                        ? (() => {
                            const correct = sub.mcqOptions.find((o) => o.isCorrect);
                            return correct ? `${correct.label} — ${correct.text}` : "لم يتم تحديد إجابة صحيحة";
                          })()
                        : sub.contentText || "—"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          
          <Text 
            style={[
              styles.footer,
              { position: "absolute", bottom: 15 }
            ]}
          >
            AKONY — مفتاح الإجابة (سري)
          </Text>
        </Page>
      )}
    </Document>
  );
}
