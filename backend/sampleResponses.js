export const todoApp = {
  id: "msg_0199FK69krGYBqEHFTsQ226X",
  type: "message",
  role: "assistant",
  model: "claude-3-5-sonnet-20241022",
  content: [
    {
      type: "text",
      text:
        "I'll help you create a beautiful and functional Todo app with React. We'll include features like task categories, due dates, and a clean UI.\n" +
        "\n" +
        '<boltArtifact id="todo-app" title="Modern Todo Application">\n' +
        '<boltAction type="file" filePath="src/types/todo.ts">\n' +
        "export interface Todo {\n" +
        "  id: string;\n" +
        "  title: string;\n" +
        "  completed: boolean;\n" +
        "  category: 'personal' | 'work' | 'shopping' | 'other';\n" +
        "  dueDate?: Date;\n" +
        "  createdAt: Date;\n" +
        "}\n" +
        "\n" +
        "export type TodoCategory = Todo['category'];\n" +
        "</boltAction>\n" +
        "\n" +
        '<boltAction type="file" filePath="src/components/TodoInput.tsx">\n' +
        "import { useState } from 'react';\n" +
        "import { PlusCircle } from 'lucide-react';\n" +
        "import { TodoCategory } from '../types/todo';\n" +
        "\n" +
        "interface TodoInputProps {\n" +
        "  onAdd: (title: string, category: TodoCategory) => void;\n" +
        "}\n" +
        "\n" +
        "export default function TodoInput({ onAdd }: TodoInputProps) {\n" +
        "  const [title, setTitle] = useState('');\n" +
        "  const [category, setCategory] = useState<TodoCategory>('personal');\n" +
        "\n" +
        "  const handleSubmit = (e: React.FormEvent) => {\n" +
        "    e.preventDefault();\n" +
        "    if (title.trim()) {\n" +
        "      onAdd(title, category);\n" +
        "      setTitle('');\n" +
        "    }\n" +
        "  };\n" +
        "\n" +
        "  return (\n" +
        '    <form onSubmit={handleSubmit} className="w-full space-y-4">\n' +
        '      <div className="flex gap-4">\n' +
        "        <input\n" +
        '          type="text"\n' +
        "          value={title}\n" +
        "          onChange={(e) => setTitle(e.target.value)}\n" +
        '          placeholder="Add a new task..."\n' +
        '          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"\n' +
        "        />\n" +
        "        <select\n" +
        "          value={category}\n" +
        "          onChange={(e) => setCategory(e.target.value as TodoCategory)}\n" +
        '          className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"\n' +
        "        >\n" +
        '          <option value="personal">Personal</option>\n' +
        '          <option value="work">Work</option>\n' +
        '          <option value="shopping">Shopping</option>\n' +
        '          <option value="other">Other</option>\n' +
        "        </select>\n" +
        "        <button\n" +
        '          type="submit"\n' +
        '          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"\n' +
        "        >\n" +
        '          <PlusCircle className="w-5 h-5" />\n' +
        "        </button>\n" +
        "      </div>\n" +
        "    </form>\n" +
        "  );\n" +
        "}\n" +
        "</boltAction>\n" +
        "\n" +
        '<boltAction type="file" filePath="src/components/TodoItem.tsx">\n' +
        "import { Check, Trash2, X } from 'lucide-react';\n" +
        "import { Todo } from '../types/todo';\n" +
        "\n" +
        "interface TodoItemProps {\n" +
        "  todo: Todo;\n" +
        "  onToggle: (id: string) => void;\n" +
        "  onDelete: (id: string) => void;\n" +
        "}\n" +
        "\n" +
        "const categoryColors = {\n" +
        "  personal: 'bg-purple-100 text-purple-800',\n" +
        "  work: 'bg-blue-100 text-blue-800',\n" +
        "  shopping: 'bg-green-100 text-green-800',\n" +
        "  other: 'bg-gray-100 text-gray-800',\n" +
        "};\n" +
        "\n" +
        "export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {\n" +
        "  return (\n" +
        '    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">\n' +
        '      <div className="flex items-center gap-4">\n' +
        "        <button\n" +
        "          onClick={() => onToggle(todo.id)}\n" +
        "          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${\n" +
        "            todo.completed\n" +
        "              ? 'bg-green-500 border-green-500'\n" +
        "              : 'border-gray-300 hover:border-green-500'\n" +
        "          }`}\n" +
        "        >\n" +
        '          {todo.completed && <Check className="w-4 h-4 text-white" />}\n' +
        "        </button>\n" +
        '        <div className="flex flex-col">\n' +
        "          <span\n" +
        "            className={`text-gray-800 ${\n" +
        "              todo.completed ? 'line-through text-gray-400' : ''\n" +
        "            }`}\n" +
        "          >\n" +
        "            {todo.title}\n" +
        "          </span>\n" +
        '          <span className="text-xs text-gray-500">\n' +
        "            Created {new Date(todo.createdAt).toLocaleDateString()}\n" +
        "          </span>\n" +
        "        </div>\n" +
        "      </div>\n" +
        '      <div className="flex items-center gap-3">\n' +
        "        <span\n" +
        "          className={`px-2 py-1 rounded-full text-xs font-medium ${\n" +
        "            categoryColors[todo.category]\n" +
        "          }`}\n" +
        "        >\n" +
        "          {todo.category}\n" +
        "        </span>\n" +
        "        <button\n" +
        "          onClick={() => onDelete(todo.id)}\n" +
        '          className="text-gray-400 hover:text-red-500 transition-colors duration-200"\n' +
        "        >\n" +
        '          <Trash2 className="w-5 h-5" />\n' +
        "        </button>\n" +
        "      </div>\n" +
        "    </div>\n" +
        "  );\n" +
        "}\n" +
        "</boltAction>\n" +
        "\n" +
        '<boltAction type="file" filePath="src/App.tsx">\n' +
        "import { useState, useEffect } from 'react';\n" +
        "import { CheckSquare } from 'lucide-react';\n" +
        "import TodoInput from './components/TodoInput';\n" +
        "import TodoItem from './components/TodoItem';\n" +
        "import { Todo, TodoCategory } from './types/todo';\n" +
        "\n" +
        "function App() {\n" +
        "  const [todos, setTodos] = useState<Todo[]>(() => {\n" +
        "    const saved = localStorage.getItem('todos');\n" +
        "    return saved ? JSON.parse(saved) : [];\n" +
        "  });\n" +
        "\n" +
        "  useEffect(() => {\n" +
        "    localStorage.setItem('todos', JSON.stringify(todos));\n" +
        "  }, [todos]);\n" +
        "\n" +
        "  const addTodo = (title: string, category: TodoCategory) => {\n" +
        "    const newTodo: Todo = {\n" +
        "      id: crypto.randomUUID(),\n" +
        "      title,\n" +
        "      category,\n" +
        "      completed: false,\n" +
        "      createdAt: new Date(),\n" +
        "    };\n" +
        "    setTodos((prev) => [newTodo, ...prev]);\n" +
        "  };\n" +
        "\n" +
        "  const toggleTodo = (id: string) => {\n" +
        "    setTodos((prev) =>\n" +
        "      prev.map((todo) =>\n" +
        "        todo.id === id ? { ...todo, completed: !todo.completed } : todo\n" +
        "      )\n" +
        "    );\n" +
        "  };\n" +
        "\n" +
        "  const deleteTodo = (id: string) => {\n" +
        "    setTodos((prev) => prev.filter((todo) => todo.id !== id));\n" +
        "  };\n" +
        "\n" +
        "  return (\n" +
        '    <div className="min-h-screen bg-gray-50">\n' +
        '      <div className="max-w-3xl mx-auto py-12 px-4">\n' +
        '        <div className="mb-8 text-center">\n' +
        '          <div className="flex items-center justify-center gap-2 mb-2">\n' +
        '            <CheckSquare className="w-8 h-8 text-blue-500" />\n' +
        '            <h1 className="text-3xl font-bold text-gray-800">Todo App</h1>\n' +
        "          </div>\n" +
        '          <p className="text-gray-600">Stay organized and get things done</p>\n' +
        "        </div>\n" +
        "\n" +
        '        <div className="space-y-6">\n' +
        "          <TodoInput onAdd={addTodo} />\n" +
        "          \n" +
        '          <div className="space-y-4">\n' +
        "            {todos.map((todo) => (\n" +
        "              <TodoItem\n" +
        "                key={todo.id}\n" +
        "                todo={todo}\n" +
        "                onToggle={toggleTodo}\n" +
        "                onDelete={deleteTodo}\n" +
        "              />\n" +
        "            ))}\n" +
        "            {todos.length === 0 && (\n" +
        '              <div className="text-center py-12 text-gray-500">\n' +
        "                No todos yet. Add one above!\n" +
        "              </div>\n" +
        "            )}\n" +
        "          </div>\n" +
        "        </div>\n" +
        "      </div>\n" +
        "    </div>\n" +
        "  );\n" +
        "}\n" +
        "\n" +
        "export default App;\n" +
        "</boltAction>\n" +
        "\n" +
        '<boltAction type="shell">\n' +
        "npm run dev\n" +
        "</boltAction></boltArtifact>\n" +
        "\n" +
        "This Todo app includes:\n" +
        "\n" +
        "- Clean and modern UI with smooth transitions\n" +
        "- Task categories with color coding\n" +
        "- Local storage persistence\n" +
        "- Completion toggling\n" +
        "- Delete functionality\n" +
        "- Creation timestamps\n" +
        "- Responsive design\n" +
        "\n" +
        "You can now add, toggle, and delete todos. The app will persist your todos in local storage.",
    },
  ],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 5582,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 2149,
  },
};
