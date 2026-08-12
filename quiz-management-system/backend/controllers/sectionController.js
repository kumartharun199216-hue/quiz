const Section = require('../models/Section');
const Question = require('../models/Question');

const addSection = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, description, order } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Section title is required.' });
    }

    const section = await Section.create({
      quizId,
      title: title.trim(),
      description: description || '',
      order: order !== undefined ? parseInt(order, 10) : 0,
    });

    return res.status(201).json({ success: true, message: 'Section created successfully', data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order } = req.body;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    if (title) section.title = title.trim();
    if (description !== undefined) section.description = description;
    if (order !== undefined) section.order = parseInt(order, 10);

    await section.save();
    return res.status(200).json({ success: true, message: 'Section updated', data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await Section.findByIdAndDelete(id);
    await Question.updateMany({ sectionId: id }, { $set: { sectionId: null } });

    return res.status(200).json({ success: true, message: 'Section deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addSection, updateSection, deleteSection };
