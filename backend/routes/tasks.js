import express from 'express';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's tasks (or all tasks for founder)
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'founder' ? {} : { userId: req.user._id };
    const tasks = await Task.find(query)
      .populate('sprintId', 'sprintNumber')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, estimatedHours } = req.body;
    // Get current active sprint
    const currentSprint = await Sprint.findOne({ status: 'active' });

    const task = new Task({
      userId: req.user._id,
      title,
      description,
      priority,
      estimatedHours,
      sprintId: currentSprint?._id,
    });
    await task.save();

    // Update sprint task count
    if (currentSprint) {
      currentSprint.totalTasks += 1;
      await currentSprint.save();
    }

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority, actualHours, founderFeedback } = req.body;

    let task;
    if (req.user.role === 'founder') {
      task = await Task.findById(req.params.id);
    } else {
      task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Handle founder feedback
    if (founderFeedback !== undefined) {
      if (req.user.role === 'founder') {
        task.founderFeedback = founderFeedback;
      } else {
        return res.status(403).json({ message: 'Only founders can provide feedback.' });
      }
    }
    
    // Update regular fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      // Update completed tasks count in sprint
      if (status === 'completed' && task.status !== 'completed') {
        const sprint = await Sprint.findById(task.sprintId);
        if (sprint) {
          sprint.completedTasks += 1;
          await sprint.save();
        }
      }
      task.status = status;
    }
    if (priority !== undefined) task.priority = priority;
    if (actualHours !== undefined) task.actualHours = actualHours;

    await task.save();

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;