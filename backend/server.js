const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'asdfasdf',
  database: process.env.DB_NAME || 'abacus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
  connection.release();
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Validate input
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Start transaction
      pool.getConnection((err, connection) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        connection.beginTransaction(async (err) => {
          if (err) {
            connection.release();
            return res.status(500).json({ error: 'Transaction error' });
          }
          
          try {
            // Insert user
            const userResult = await new Promise((resolve, reject) => {
              connection.query(
                'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, name, role],
                (err, result) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve(result);
                }
              );
            });
            
            const userId = userResult.insertId;
            
            // Create profile
            await new Promise((resolve, reject) => {
              connection.query(
                'INSERT INTO profiles (user_id, name, email, role) VALUES (?, ?, ?, ?)',
                [userId, name, email, role],
                (err, result) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve(result);
                }
              );
            });
            
            // Commit transaction
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: 'Failed to create user' });
                });
              }
              
              // Generate JWT
              const token = jwt.sign(
                { userId: userId, email, role },
                JWT_SECRET,
                { expiresIn: '7d' }
              );
              
              connection.release();
              
              res.status(201).json({
                token,
                user: {
                  id: userId,
                  email,
                  name,
                  role
                }
              });
            });
          } catch (error) {
            // Rollback on error
            await new Promise((resolve, reject) => {
              connection.rollback(() => {
                connection.release();
                reject(error);
              });
            });
            
            res.status(500).json({ error: 'Server error' });
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = results[0];
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Get profile
      pool.query('SELECT * FROM profiles WHERE user_id = ?', [user.id], (err, profileResults) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (profileResults.length === 0) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        
        const profile = profileResults[0];
        
        // Generate JWT
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            name: profile.name,
            email: profile.email,
            role: profile.role
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/me', authenticateToken, (req, res) => {
  const { userId, email, role } = req.user;
  res.json({ id: userId, email, role });
});

// Profile routes
app.get('/api/profile/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  
  // Check if the requested profile belongs to the logged-in user
  if (req.user.userId !== parseInt(userId) && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  pool.query(
    'SELECT * FROM profiles WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json(results[0]);
    }
  );
});

app.put('/api/profile/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const { name } = req.body;
  
  // Check if the user is updating their own profile or is a teacher
  if (req.user.userId !== parseInt(userId) && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  pool.query(
    'UPDATE profiles SET name = ?, updated_at = NOW() WHERE user_id = ?',
    [name, userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      pool.query(
        'SELECT * FROM profiles WHERE user_id = ?',
        [userId],
        (err, results) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json(results[0]);
        }
      );
    }
  );
});

// Levels routes
app.get('/api/levels', authenticateToken, (req, res) => {
  pool.query('SELECT * FROM levels ORDER BY level_order', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

app.get('/api/levels/:id', authenticateToken, (req, res) => {
  pool.query(
    'SELECT * FROM levels WHERE id = ?',
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Level not found' });
      }
      
      res.json(results[0]);
    }
  );
});

app.post('/api/levels', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, description, level_order, min_accuracy, min_speed_seconds, exercises_required } = req.body;

  pool.query(
    'INSERT INTO levels (name, description, level_order, min_accuracy, min_speed_seconds, exercises_required, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, description, level_order, min_accuracy, min_speed_seconds, exercises_required, req.user.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id: result.insertId,
        name,
        description,
        level_order,
        min_accuracy,
        min_speed_seconds,
        exercises_required,
        created_by: req.user.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  );
});

app.put('/api/levels/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, description, level_order, min_accuracy, min_speed_seconds, exercises_required } = req.body;

  pool.query(
    'UPDATE levels SET name = ?, description = ?, level_order = ?, min_accuracy = ?, min_speed_seconds = ?, exercises_required = ?, updated_at = NOW() WHERE id = ?',
    [name, description, level_order, min_accuracy, min_speed_seconds, exercises_required, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Level not found' });
      }

      pool.query('SELECT * FROM levels WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
      });
    }
  );
});

app.delete('/api/levels/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  pool.query('DELETE FROM levels WHERE id = ?', [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Level not found' });
    }

    res.json({ success: true });
  });
});

// Student self route
app.get('/api/students/me', authenticateToken, (req, res) => {
  pool.query(
    `SELECT s.*, p.id AS profile_id, p.user_id AS profile_user_id, p.name AS student_name, p.email AS student_email, p.role AS student_role,
            p.created_at AS profile_created_at, p.updated_at AS profile_updated_at,
            l.id AS level_id, l.name AS level_name, l.description AS level_description,
            l.level_order AS level_order, l.min_accuracy AS min_accuracy,
            l.min_speed_seconds AS min_speed_seconds, l.exercises_required AS exercises_required
     FROM students s
     JOIN profiles p ON s.profile_id = p.id
     LEFT JOIN levels l ON s.current_level_id = l.id
     WHERE p.user_id = ?`,
    [req.user.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const row = results[0];
      res.json({
        id: row.id,
        profile_id: row.profile_id,
        teacher_id: row.teacher_id,
        current_level_id: row.current_level_id,
        enrolled_at: row.enrolled_at,
        is_active: row.is_active,
        notes: row.notes,
        updated_at: row.updated_at,
        profile: {
          id: row.profile_id,
          user_id: row.profile_user_id,
          name: row.student_name,
          email: row.student_email,
          role: row.student_role,
          created_at: row.profile_created_at,
          updated_at: row.profile_updated_at,
        },
        level: row.level_id ? {
          id: row.level_id,
          name: row.level_name,
          description: row.level_description,
          level_order: row.level_order,
          min_accuracy: row.min_accuracy,
          min_speed_seconds: row.min_speed_seconds,
          exercises_required: row.exercises_required,
          created_by: null,
          created_at: row.profile_created_at,
          updated_at: row.profile_updated_at,
        } : null,
      });
    }
  );
});

// Students routes (for teachers)
app.get('/api/students', authenticateToken, (req, res) => {
  // Only teachers can access this
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const teacherId = req.user.userId;
  
  pool.query(`
    SELECT s.*, p.id AS profile_id, p.user_id AS profile_user_id, p.name AS student_name, p.email AS student_email, p.role AS student_role,
           p.created_at AS profile_created_at, p.updated_at AS profile_updated_at,
           l.id AS level_id, l.name AS level_name
    FROM students s
    JOIN profiles p ON s.profile_id = p.id
    LEFT JOIN levels l ON s.current_level_id = l.id
    WHERE s.teacher_id = ?
  `, [teacherId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const students = results.map((row) => ({
      id: row.id,
      profile_id: row.profile_id,
      teacher_id: row.teacher_id,
      current_level_id: row.current_level_id,
      enrolled_at: row.enrolled_at,
      is_active: row.is_active,
      notes: row.notes,
      updated_at: row.updated_at,
      profile: {
        id: row.profile_id,
        user_id: row.profile_user_id,
        name: row.student_name,
        email: row.student_email,
        role: row.student_role,
        created_at: row.profile_created_at,
        updated_at: row.profile_updated_at,
      },
      level: row.level_id ? {
        id: row.level_id,
        name: row.level_name,
      } : null,
    }));

    res.json(students);
  });
});

app.post('/api/students', authenticateToken, (req, res) => {
  // Only teachers can add students
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { profile_id, teacher_id, current_level_id, notes } = req.body;
  
  // Verify that the teacher_id matches the logged-in user
  if (teacher_id !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  pool.query(
    'INSERT INTO students (profile_id, teacher_id, current_level_id, notes) VALUES (?, ?, ?, ?)',
    [profile_id, teacher_id, current_level_id || null, notes || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id: result.insertId,
        profile_id,
        teacher_id,
        current_level_id: current_level_id || null,
        enrolled_at: new Date().toISOString(),
        is_active: true,
        notes: notes || null,
        updated_at: new Date().toISOString()
      });
    }
  );
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { current_level_id, notes } = req.body;

  pool.query(
    'UPDATE students SET current_level_id = ?, notes = ?, updated_at = NOW() WHERE id = ? AND teacher_id = ?',
    [current_level_id || null, notes || null, req.params.id, req.user.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found or access denied' });
      }

      pool.query('SELECT * FROM students WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
      });
    }
  );
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  pool.query('DELETE FROM students WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found or access denied' });
    }

    res.json({ success: true });
  });
});

// Exercise attempts routes
app.post('/api/exercise-attempts', authenticateToken, (req, res) => {
  const { operation, num1, num2, correct_answer, user_answer, is_correct, time_taken } = req.body;
  
  if (operation === undefined || num1 === undefined || num2 === undefined || correct_answer === undefined || user_answer === undefined || is_correct === undefined || time_taken === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  pool.query(
    `SELECT s.id AS student_id
     FROM students s
     JOIN profiles p ON s.profile_id = p.id
     WHERE p.user_id = ?`,
    [req.user.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: 'Student record not found' });
      }

      const student_id = results[0].student_id;

      pool.query(
        'INSERT INTO exercise_attempts (student_id, operation, num1, num2, correct_answer, user_answer, is_correct, time_taken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [student_id, operation, num1, num2, correct_answer, user_answer, is_correct, time_taken],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.status(201).json({ id: result.insertId });
        }
      );
    }
  );
});

app.get('/api/exercise-attempts/me', authenticateToken, (req, res) => {
  pool.query(
    `SELECT ea.*, s.id AS student_id
     FROM exercise_attempts ea
     JOIN students s ON ea.student_id = s.id
     JOIN profiles p ON s.profile_id = p.id
     WHERE p.user_id = ?
     ORDER BY ea.created_at DESC`,
    [req.user.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const attempts = results.map((row) => ({
        id: row.id,
        student_id: row.student_id,
        operation: row.operation,
        num1: row.num1,
        num2: row.num2,
        correct_answer: row.correct_answer,
        user_answer: row.user_answer,
        is_correct: row.is_correct,
        time_taken: row.time_taken,
        time_taken_seconds: row.time_taken,
        attempted_at: row.created_at,
        created_at: row.created_at,
      }));

      res.json(attempts);
    }
  );
});

app.get('/api/exercise-attempts/teacher/:teacherId', authenticateToken, (req, res) => {
  const teacherId = parseInt(req.params.teacherId, 10);

  if (req.user.role !== 'teacher' || req.user.userId !== teacherId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  pool.query(
    `SELECT ea.*, s.id AS student_id, p.name AS student_name, p.email AS student_email
     FROM exercise_attempts ea
     JOIN students s ON ea.student_id = s.id
     JOIN profiles p ON s.profile_id = p.id
     WHERE s.teacher_id = ?
     ORDER BY ea.created_at DESC`,
    [teacherId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const attempts = results.map((row) => ({
        id: row.id,
        student_id: row.student_id,
        operation: row.operation,
        num1: row.num1,
        num2: row.num2,
        correct_answer: row.correct_answer,
        user_answer: row.user_answer,
        is_correct: row.is_correct,
        time_taken: row.time_taken,
        created_at: row.created_at,
        student: {
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
        },
      }));

      res.json(attempts);
    }
  );
});

// Get exercises (for teachers or practice)
app.get('/api/exercises', authenticateToken, (req, res) => {
  // Optionally filter by level or exercise type
  pool.query('SELECT * FROM exercises', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

app.post('/api/exercises', authenticateToken, (req, res) => {
  // In a real app, you'd check if the user is a teacher/admin
  const { lesson_id, exercise_type, problem, answer, difficulty } = req.body;
  
  pool.query(
    'INSERT INTO exercises (lesson_id, exercise_type, problem, answer, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [lesson_id, exercise_type, problem, answer, difficulty || 1, req.user.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id: result.insertId,
        lesson_id,
        exercise_type,
        problem,
        answer,
        difficulty: difficulty || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});