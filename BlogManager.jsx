import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Editor } from '@tinymce/tinymce-react';
import './BlogManager.css';

const BlogManager = () => {
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [categories, setCategories] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [blogEntries, setBlogEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    fetchBlogEntries();

    return () => unsubscribe();
  }, []);

  const fetchBlogEntries = async () => {
    const querySnapshot = await getDocs(collection(db, 'blogs'));
    const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBlogEntries(entries);
  };

  const handleAddOrUpdateEntry = async (e) => {
    e.preventDefault();
    if (!user) return;

    const entryData = {
      title: title || '',
      content: editorContent || '',
      authorId: user.uid,
      categories: categories ? categories.split(',').map(cat => cat.trim()) : [],
      publishDate: publishDate || '',
    };

    if (editingEntry) {
      await updateDoc(doc(db, 'blogs', editingEntry.id), entryData);
      setEditingEntry(null);
    } else {
      await addDoc(collection(db, 'blogs'), entryData);
    }

    fetchBlogEntries();
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setTitle('');
    setEditorContent('');
    setCategories('');
    setPublishDate('');
  };

  const handleEdit = (entry) => {
    setTitle(entry.title);
    setEditorContent(entry.content);
    setCategories(entry.categories.join(', '));
    setPublishDate(entry.publishDate);
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'blogs', id));
    fetchBlogEntries();
  };

  const filteredEntries = blogEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="blog-manager">
      <h2 className="text-2xl font-bold mb-4">{editingEntry ? 'Edit Blog Post' : 'Add Blog Post'}</h2>
      <form onSubmit={handleAddOrUpdateEntry} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
          <Editor
            apiKey='gr4c0infs006w2a1xk4sui58gg7s167pe4sw2rld12p45p3f'
            value={editorContent}
            onEditorChange={(content) => setEditorContent(content)}
            init={{
              plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount checklist mediaembed casechange export formatpainter pageembed linkchecker a11ychecker tinymcespellchecker permanentpen powerpaste advtable advcode editimage advtemplate ai mentions tinycomments tableofcontents footnotes mergetags autocorrect typography inlinecss markdown',
              toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
              tinycomments_mode: 'embedded',
              tinycomments_author: 'Author name',
              mergetags_list: [
                { value: 'First.Name', title: 'First Name' },
                { value: 'Email', title: 'Email' },
              ],
              ai_request: (request, respondWith) => respondWith.string(() => Promise.reject("See docs to implement AI Assistant")),
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categories (comma separated)</label>
          <input type="text" value={categories} onChange={(e) => setCategories(e.target.value)} className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Publish Date</label>
          <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={!user}>
            {editingEntry ? 'Update Post' : 'Add Post'}
          </button>
        </div>
      </form>
      <h2 className="text-2xl font-bold mt-8 mb-4">Blog Posts</h2>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <ul>
        {filteredEntries.map(entry => (
          <li key={entry.id} className="mb-4 p-4 border border-gray-300 rounded-md">
            <h3 className="text-xl font-bold">{entry.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: entry.content }}></div>
            <p className="mt-2"><strong>Author ID:</strong> {entry.authorId}</p>
            <p className="mt-2"><strong>Categories:</strong> {entry.categories.join(', ')}</p>
            <p className="mt-2"><strong>Publish Date:</strong> {entry.publishDate}</p>
            {user && (
              <div className="mt-2 flex space-x-2">
                <button onClick={() => handleEdit(entry)} className="px-4 py-2 bg-yellow-500 text-white rounded-md">Edit</button>
                <button onClick={() => handleDelete(entry.id)} className="px-4 py-2 bg-red-500 text-white rounded-md">Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlogManager;
