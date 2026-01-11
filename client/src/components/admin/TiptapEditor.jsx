import { Editor } from "@tinymce/tinymce-react";
import { useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";
import { getAccessToken } from "../../utils/tokenRefresh";

/**
 * Rich Text Editor using TinyMCE
 * Replaces the previous Tiptap implementation for a more robust "CRM-like" experience.
 *
 * Note: Keeps the component name "TiptapEditor" to avoid breaking imports in existing pages.
 */
const TiptapEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (blobInfo, progress) =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", blobInfo.blob(), blobInfo.filename());

      const token = getAccessToken();

      axios
        .post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token ? `Bearer ${token}` : "",
          },
          onUploadProgress: (e) => {
            progress((e.loaded / e.total) * 100);
          },
        })
        .then((response) => {
          // Handle different response structures
          const url =
            response.data?.url ||
            response.data?.secure_url ||
            response.data?.data?.url ||
            response.data?.data?.secure_url;

          if (url) {
            resolve(url);
          } else {
            console.error("Invalid upload response:", response.data);
            reject({ message: "Invalid response from server - no URL found" });
          }
        })
        .catch((error) => {
          console.error("Image upload failed:", error);

          // Provide more specific error messages
          let errorMessage = "Image upload failed";
          if (error.response?.status === 413) {
            errorMessage = "File too large. Please choose a smaller image.";
          } else if (error.response?.status === 401) {
            errorMessage = "Authentication required. Please log in again.";
          } else if (error.response?.status === 403) {
            errorMessage = "Permission denied. You do not have upload rights.";
          } else if (error.code === "NETWORK_ERROR") {
            errorMessage = "Network error. Please check your connection.";
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }

          reject({ message: errorMessage });
        });
    });

  return (
    <div className="rounded-lg overflow-hidden border border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-shadow">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
      <Editor
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsLoading(false);
        }}
        value={value}
        onEditorChange={(content) => onChange(content)}
        apiKey={import.meta.env.VITE_TINY_API_KEY || "no-api-key"}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "code",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | " +
            "bold italic forecolor backcolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | image media link table | help",
          content_style: `
                        body { font-family: 'Inter', sans-serif; font-size: 16px; color: #374151; line-height: 1.6; }
                        img { max-width: 100%; height: auto; border-radius: 0.5rem; }
                        blockquote { border-left: 3px solid #e5e7eb; padding-left: 1rem; font-style: italic; color: #6b7280; }
                    `,
          images_upload_handler: handleImageUpload,
          placeholder: placeholder,
          branding: false,
          promotion: false,
        }}
      />
    </div>
  );
};

export default TiptapEditor;
