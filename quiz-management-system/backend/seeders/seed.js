const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const Admin = require('../models/Admin');
const Quiz = require('../models/Quiz');
const Section = require('../models/Section');
const Question = require('../models/Question');
const { quizzesToSeed } = require('./quizData');

const seedData = async (isAutoSeed = false) => {
  try {
    if (!isAutoSeed) {
      console.log('[Seeder] Connecting to database...');
      await connectDB();
    }

    // 1. Seed SUPER_ADMIN
    const adminEmail = 'admin@quiz.com';
    let superAdmin = await Admin.findOne({ email: adminEmail });

    if (!superAdmin) {
      console.log(`[Seeder] Seeding initial Super Admin: ${adminEmail}...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Admin@123', salt);

      superAdmin = await Admin.create({
        name: 'System Super Admin',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isInitialSuperAdmin: true,
      });

      console.log(`[Seeder] Super Admin created successfully.`);
    } else {
      console.log(`[Seeder] Super Admin (${adminEmail}) already exists. Skipping duplication.`);
    }

    // 2. Seed All 9 Technical Assessments (50 questions, 45 Mins duration each)
    console.log('[Seeder] Seeding 9 Professional Assessments (HTML, CSS, JS, Python, Java, Node.js, Express.js, SQL, PowerBI)...');

    let newQuizzesCount = 0;
    let newQuestionsCount = 0;

    for (const qItem of quizzesToSeed) {
      let quiz = await Quiz.findOne({ title: qItem.title });

      if (!quiz) {
        const questionsList = qItem.getQuestions();
        const totalMarks = questionsList.length; // 50 marks

        quiz = await Quiz.create({
          title: qItem.title,
          description: `Industry-standard professional assessment covering real-time production concepts, coding output, architecture, and best practices.`,
          quizType: qItem.quizType || 'Technical',
          duration: qItem.duration || 45, // 45 Minutes Timer
          passingPercentage: qItem.passingPercentage || 50,
          totalMarks,
          hasSections: false,
          randomizeQuestions: true,
          randomizeOptions: true,
          allowBackNavigation: true,
          enableNegativeMarking: false,
          status: 'PUBLISHED',
          createdBy: superAdmin._id,
        });

        // Insert 50 questions
        const questionsToInsert = questionsList.map((q, index) => ({
          quizId: quiz._id,
          sectionId: null,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: 1,
          negativeMarks: 0,
          order: index + 1,
        }));

        await Question.insertMany(questionsToInsert);
        newQuizzesCount++;
        newQuestionsCount += questionsToInsert.length;
        console.log(`[Seeder] Created quiz "${qItem.title}" with ${questionsToInsert.length} questions (45 Mins duration).`);
      } else {
        // Ensure duration is 45 mins
        if (quiz.duration !== 45) {
          quiz.duration = 45;
          await quiz.save();
        }
      }
    }

    console.log('\n================ SEED SUMMARY ================');
    console.log('Admin Email:         admin@quiz.com');
    console.log('Admin Password:      Admin@123 [development credential]');
    console.log('Role:                SUPER_ADMIN');
    console.log(`Newly Seeded Quizzes: ${newQuizzesCount}`);
    console.log(`Total Questions:     ${newQuestionsCount}`);
    console.log('==============================================\n');

    if (!isAutoSeed) {
      await disconnectDB();
      console.log('[Seeder] Seeding completed successfully.');
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seeder Error]', error);
    if (!isAutoSeed) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData(false);
}

module.exports = { seedData };
