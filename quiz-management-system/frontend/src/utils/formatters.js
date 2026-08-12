export const formatIndianDateTime = (dateObj) => {
  if (!dateObj) return 'N/A';
  const d = new Date(dateObj);

  const day = d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' });
  const month = d.toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
  const year = d.toLocaleDateString('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return `${day}/${month}/${year} - ${time}`;
};

export const generateCorporateEmailStatement = ({
  studentName = 'Candidate',
  studentEmail = '',
  quizTitle = 'Assessment',
  obtainedMarks = 0,
  totalMarks = 0,
  percentage = 0,
  passingPercentage = 50,
  resultStatus = 'Passed',
  submittedAt = new Date(),
}) => {
  const formattedTime = formatIndianDateTime(submittedAt);
  const numericPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage || 0;
  const isPassed = resultStatus === 'Passed' || resultStatus === 'PASSED' || numericPercentage >= passingPercentage;

  if (isPassed) {
    return `Subject: Congratulations! Result for ${quizTitle} Assessment\n\nDear ${studentName},\n\nThank you for taking the ${quizTitle} assessment.\n\nWe are pleased to inform you that you have successfully PASSED the online technical evaluation.\n\nAssessment Details:\n- Candidate Name: ${studentName}\n- Candidate Email: ${studentEmail}\n- Assessment: ${quizTitle}\n- Completion Date & Time: ${formattedTime}\n- Score Obtained: ${obtainedMarks} / ${totalMarks}\n- Overall Percentage: ${numericPercentage}%\n- Status: PASSED (Passing Criteria: ${passingPercentage}%)\n\nOur talent acquisition team will review your assessment performance and reach out to you shortly regarding the next interview round.\n\nBest Regards,\nAssessment & Recruitment Team`;
  } else {
    return `Subject: Update on your ${quizTitle} Assessment Result\n\nDear ${studentName},\n\nThank you for participating in the ${quizTitle} assessment.\n\nWe appreciate the effort and time you invested in taking this evaluation. After carefully evaluating your attempt, we regret to inform you that your score did not meet the passing criteria for this specific assessment.\n\nAssessment Details:\n- Candidate Name: ${studentName}\n- Candidate Email: ${studentEmail}\n- Assessment: ${quizTitle}\n- Completion Date & Time: ${formattedTime}\n- Score Obtained: ${obtainedMarks} / ${totalMarks}\n- Overall Percentage: ${numericPercentage}%\n- Status: FAILED (Passing Criteria: ${passingPercentage}%)\n\nWhile you were not selected for this position at this time, we encourage you to keep developing your skills and apply for future technical opportunities with us.\n\nWe wish you all the best in your career endeavors.\n\nBest Regards,\nAssessment & Recruitment Team`;
  }
};
