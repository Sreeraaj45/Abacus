import { useState, useEffect } from 'react';
import EmptyState from '../components/EmptyState';
import type { Level } from '../types';
import { Plus, Edit2, Trash2, Save, X, Award, AlertCircle, Layers } from 'lucide-react';

const emptyLevel: Omit<Level, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
  name: '',
  description: '',
  level_order: 1,
  min_accuracy: 80,
  min_speed_seconds: 10,
  exercises_required: 100,
};

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Level, 'id' | 'created_at' | 'updated_at' | 'created_by'>>(emptyLevel);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLevel, setNewLevel] = useState(emptyLevel);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('level_order', { ascending: true });

    if (!error && data) {
      setLevels(data);
    }
    setLoading(false);
  };

  const handleEdit = (level: Level) => {
    setEditingId(level.id);
    setEditForm({
      name: level.name,
      description: level.description || '',
      level_order: level.level_order,
      min_accuracy: level.min_accuracy,
      min_speed_seconds: level.min_speed_seconds,
      exercises_required: level.exercises_required,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from('levels')
      .update({
        ...editForm,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setLevels(levels.map(l => l.id === editingId ? { ...l, ...editForm } : l));
    setEditingId(null);
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyLevel);
  };

  const handleAdd = async () => {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from('levels')
      .insert([newLevel])
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    if (data) {
      setLevels([...levels, data].sort((a, b) => a.level_order - b.level_order));
    }
    setShowAddForm(false);
    setNewLevel(emptyLevel);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;

    const { error } = await supabase
      .from('levels')
      .delete()
      .eq('id', id);

    if (!error) {
      setLevels(levels.filter(l => l.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Level Configuration</h2>
          <p className="text-gray-600 mt-1">Manage difficulty levels and requirements</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Level
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Level</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newLevel.name}
                onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Level 11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level Order</label>
              <input
                type="number"
                value={newLevel.level_order}
                onChange={(e) => setNewLevel({ ...newLevel, level_order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Accuracy (%)</label>
              <input
                type="number"
                value={newLevel.min_accuracy}
                onChange={(e) => setNewLevel({ ...newLevel, min_accuracy: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (sec)</label>
              <input
                type="number"
                value={newLevel.min_speed_seconds}
                onChange={(e) => setNewLevel({ ...newLevel, min_speed_seconds: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercises Required</label>
              <input
                type="number"
                value={newLevel.exercises_required}
                onChange={(e) => setNewLevel({ ...newLevel, exercises_required: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newLevel.description}
                onChange={(e) => setNewLevel({ ...newLevel, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Advanced operations"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !newLevel.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Level'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {levels.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-10 h-10" />}
            title="No levels configured"
            description="Create your first level to start organizing your curriculum"
            action={{ label: 'Add Level', onClick: () => setShowAddForm(true) }}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Accuracy</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Time</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Exercises</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {levels.map((level) => (
                <tr key={level.id} className="hover:bg-gray-50">
                  {editingId === level.id ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {editForm.level_order}
                          </div>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded w-32"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded w-full"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={editForm.min_accuracy}
                          onChange={(e) => setEditForm({ ...editForm, min_accuracy: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          min={0}
                          max={100}
                        />
                        %
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={editForm.min_speed_seconds}
                          onChange={(e) => setEditForm({ ...editForm, min_speed_seconds: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        s
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={editForm.exercises_required}
                          onChange={(e) => setEditForm({ ...editForm, exercises_required: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {level.level_order}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{level.name}</p>
                            <p className="text-sm text-gray-500">Order: {level.level_order}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{level.description || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <Award className="w-4 h-4" />
                          {level.min_accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{level.min_speed_seconds}s</td>
                      <td className="px-6 py-4 text-center text-gray-600">{level.exercises_required}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(level)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(level.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
