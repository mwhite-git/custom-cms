import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { Editor } from '@tinymce/tinymce-react';
import './PortfolioManager.css';

const PortfolioManager = () => {
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [displayImageUrl, setDisplayImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [featured, setFeatured] = useState(false);
  const [portfolioEntries, setPortfolioEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchPortfolioEntries();
  }, []);

  const fetchPortfolioEntries = async () => {
    const q = selectedTag
      ? query(collection(db, 'portfolio'), where('tags', 'array-contains', selectedTag))
      : collection(db, 'portfolio');
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPortfolioEntries(entries);
  };

  const handleAddOrUpdateEntry = async (e) => {
    e.preventDefault();
    if (!user) return;

    const newImageUrls = [];
    for (const image of images) {
      const imageRef = ref(storage, `portfolio/${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);
      newImageUrls.push(imageUrl);
    }

    const mergedImageUrls = [...existingImages, ...newImageUrls];

    const entryData = {
      title: title || '',
      description: editorContent || '',
      imageUrls: mergedImageUrls || [],
      displayImageUrl: displayImageUrl || mergedImageUrls[0] || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      technologies: technologies ? technologies.split(',').map(tech => tech.trim()) : [], 
      githubLink: githubLink || '',
      featured: featured || false,
    };

    if (editingEntry) {
      await updateDoc(doc(db, 'portfolio', editingEntry.id), entryData);
      setEditingEntry(null);
    } else {
      await addDoc(collection(db, 'portfolio'), entryData);
    }

    fetchPortfolioEntries();
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setTitle('');
    setEditorContent('');
    setImages([]);
    setExistingImages([]);
    setDisplayImageUrl('');
    setTags('');
    setTechnologies(''); 
    setGithubLink('');
    setFeatured(false);
  };

  const handleEdit = (entry) => {
    setTitle(entry.title);
    setEditorContent(entry.description);
    setExistingImages(entry.imageUrls || []);
    setDisplayImageUrl(entry.displayImageUrl || '');
    setTags(entry.tags.join(', '));
    setTechnologies(entry.technologies ? entry.technologies.join(', ') : '');
    setGithubLink(entry.githubLink);
    setFeatured(entry.featured);
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleDelete = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'portfolio', id));
    fetchPortfolioEntries();
  };

  const handleRemoveExistingImage = (index) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedImages);
  };

  const filteredEntries = portfolioEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="portfolio-manager">
      <h2 className="text-2xl font-bold mb-4">{editingEntry ? 'Edit Portfolio Entry' : 'Add Portfolio Entry'}</h2>
      <form onSubmit={handleAddOrUpdateEntry} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2
          text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Images</label>
          <input type="file" multiple onChange={(e) => setImages(Array.from(e.target.files))} className="mt-1 block w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Existing Images</label>
          <div className="flex flex-wrap">
            {existingImages.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`Portfolio ${index}`} className="portfolio-image m-1" />
                <button type="button" onClick={() => handleRemoveExistingImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1">X</button>
                <button type="button" onClick={() => setDisplayImageUrl(url)} className={`absolute bottom-0 right-0 ${displayImageUrl === url ? 'bg-green-500' : 'bg-gray-500'} text-white rounded-full p-1`}>Display</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Technologies (comma separated)</label>
          <input type="text" value={technologies} onChange={(e) => setTechnologies(e.target.value)} className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Link</label>
          <input type="url" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} required className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            id="featured"
            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
          />
          <label htmlFor="featured" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
          Featured
          </label>
        </div>
        <div>
          <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={!user}>
            {editingEntry ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>
      </form>
      <h2 className="text-2xl font-bold mt-8 mb-4">Portfolio Entries</h2>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Tags</option>
          {[...new Set(portfolioEntries.flatMap(entry => entry.tags))].map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>
      <ul>
        {filteredEntries.map(entry => (
          <li key={entry.id} className="mb-4 p-4 border border-gray-300 rounded-md">
            <h3 className="text-xl font-bold">{entry.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: entry.description }}></div>
            <div className="portfolio-images">
              {entry.imageUrls && entry.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={entry.title} className="portfolio-image" />
              ))}
            </div>
            <p className="mt-2"><strong>Tags:</strong> {entry.tags.join(', ')}</p>
            <p className="mt-2"><strong>Technologies:</strong> {entry.technologies ? entry.technologies.join(', ') : 'N/A'}</p> {/* Display technologies */}
            <p><a href={entry.githubLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub Repository</a></p>
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

export default PortfolioManager;
