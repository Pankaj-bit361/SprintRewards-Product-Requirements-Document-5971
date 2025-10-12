import express from 'express';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .populate('sprintId', 'sprintNumber')
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
      sprintId: currentSprint?._id
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
    const { title, description, status, priority, actualHours } = req.body;
    
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update completed tasks count in sprint
    if (status === 'completed' && task.status !== 'completed') {
      const sprint = await Sprint.findById(task.sprintId);
      if (sprint) {
        sprint.completedTasks += 1;
        await sprint.save();
      }
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.actualHours = actualHours || task.actualHours;

    await task.save();

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;