// Premium WYSIWYG Rich Note Editor Component

export class NoteEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onSave = options.onSave || (() => {});
    this.placeholder = options.placeholder || "Start writing your notes here...";
    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="note-editor-wrapper glass-panel" style="background: rgba(255,255,255,0.01); border: none;">
        <!-- Rich text formatting toolbar -->
        <div class="note-editor-toolbar">
          <button class="note-toolbar-btn btn-format" data-cmd="formatBlock" data-val="H1" title="Heading 1"><i class="fa-solid fa-heading" style="font-size:13px;"></i>1</button>
          <button class="note-toolbar-btn btn-format" data-cmd="formatBlock" data-val="H2" title="Heading 2"><i class="fa-solid fa-heading" style="font-size:11px;"></i>2</button>
          <button class="note-toolbar-btn btn-format" data-cmd="formatBlock" data-val="P" title="Normal text"><i class="fa-solid fa-paragraph"></i></button>
          
          <div style="width: 1px; height: 20px; background: var(--panel-border); margin: 0 4px;"></div>
          
          <button class="note-toolbar-btn btn-format" data-cmd="bold" title="Bold (Ctrl+B)"><i class="fa-solid fa-bold"></i></button>
          <button class="note-toolbar-btn btn-format" data-cmd="italic" title="Italic (Ctrl+I)"><i class="fa-solid fa-italic"></i></button>
          <button class="note-toolbar-btn btn-format" data-cmd="underline" title="Underline (Ctrl+U)"><i class="fa-solid fa-underline"></i></button>
          <button class="note-toolbar-btn btn-format" data-cmd="hiliteColor" data-val="#4f46e5" title="Highlight text"><i class="fa-solid fa-highlighter"></i></button>
          
          <div style="width: 1px; height: 20px; background: var(--panel-border); margin: 0 4px;"></div>
          
          <button class="note-toolbar-btn btn-format" data-cmd="insertUnorderedList" title="Bulleted list"><i class="fa-solid fa-list-ul"></i></button>
          <button class="note-toolbar-btn btn-format" data-cmd="insertOrderedList" title="Numbered list"><i class="fa-solid fa-list-ol"></i></button>
          <button class="note-toolbar-btn btn-insert-todo" title="Insert Todo Checklist"><i class="fa-regular fa-square-check"></i></button>
          <button class="note-toolbar-btn btn-insert-table" title="Insert Table (3x3)"><i class="fa-solid fa-table"></i></button>
          
          <div style="width: 1px; height: 20px; background: var(--panel-border); margin: 0 4px;"></div>
          <button class="note-toolbar-btn btn-upload-photo" style="background: rgba(99, 102, 241, 0.1); color: #818cf8;"><i class="fa-solid fa-camera"></i> Photo</button>
          <button class="note-toolbar-btn btn-export-pdf" style="background: rgba(239, 68, 68, 0.1); color: #f87171;"><i class="fa-solid fa-file-pdf"></i> PDF</button>
          
          <button class="note-toolbar-btn btn-save-note-doc" title="Save notes manually" style="margin-left: auto; color: var(--color-success); background: var(--color-success-glow);"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </div>

        <!-- contenteditable body frame -->
        <div class="note-editor-body" contenteditable="true" spellcheck="false"></div>
      </div>
    `;

    this.editorBody = this.container.querySelector('.note-editor-body');
    this.setupEvents();
  }

  setupEvents() {
    // Toolbar buttons click
    this.container.querySelectorAll('.btn-format').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        
        if (cmd === 'formatBlock') {
          document.execCommand(cmd, false, `<${val}>`);
        } else {
          document.execCommand(cmd, false, val);
        }
        this.editorBody.focus();
      });
    });

    // Insert Checklist todo item
    this.container.querySelector('.btn-insert-todo').addEventListener('click', (e) => {
      e.preventDefault();
      const todoHtml = `<div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;" contenteditable="false"><input type="checkbox" style="margin-top: 4px; accent-color: var(--color-primary); cursor: pointer;"><span contenteditable="true" style="outline: none; flex: 1;">New Target</span></div>`;
      document.execCommand('insertHTML', false, todoHtml);
      this.editorBody.focus();
    });

    // Insert Table item
    this.container.querySelector('.btn-insert-table').addEventListener('click', (e) => {
      e.preventDefault();
      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--panel-border);">
              <th style="padding: 8px; border: 1px solid var(--panel-border);">Header 1</th>
              <th style="padding: 8px; border: 1px solid var(--panel-border);">Header 2</th>
              <th style="padding: 8px; border: 1px solid var(--panel-border);">Header 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid var(--panel-border);">Cell 1</td>
              <td style="padding: 8px; border: 1px solid var(--panel-border);">Cell 2</td>
              <td style="padding: 8px; border: 1px solid var(--panel-border);">Cell 3</td>
            </tr>
          </tbody>
        </table>
        <p></p>
      `;
      document.execCommand('insertHTML', false, tableHtml);
      this.editorBody.focus();
    });

    // Save Doc trigger
    this.container.querySelector('.btn-save-note-doc').addEventListener('click', () => {
      this.onSave(this.getContent());
    });

    // Upload Photo trigger
    this.container.querySelector('.btn-upload-photo').addEventListener('click', (e) => {
      e.preventDefault();
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      
      fileInput.onchange = (evt) => {
        const file = evt.target.files[0];
        if (!file) return;
        
        this.compressImage(file, (compressedBase64) => {
          this.editorBody.focus();
          document.execCommand('insertHTML', false, `<img src="${compressedBase64}" style="max-width: 100%; border-radius: 8px; margin: 12px 0; display: block; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">`);
        });
      };
      fileInput.click();
    });

    // Export PDF trigger
    this.container.querySelector('.btn-export-pdf').addEventListener('click', (e) => {
      e.preventDefault();
      this.exportPdf();
    });

    // Handle checkboxes clicking in editor
    this.editorBody.addEventListener('click', (e) => {
      if (e.target && e.target.type === 'checkbox') {
        const checkbox = e.target;
        if (checkbox.checked) {
          checkbox.nextElementSibling.style.textDecoration = 'line-through';
          checkbox.nextElementSibling.style.opacity = '0.5';
        } else {
          checkbox.nextElementSibling.style.textDecoration = 'none';
          checkbox.nextElementSibling.style.opacity = '1';
        }
      }
    });

    // Setup basic placeholder support
    this.editorBody.addEventListener('focus', () => {
      if (this.editorBody.innerHTML.trim() === `<p style="color: var(--text-muted);">${this.placeholder}</p>`) {
        this.editorBody.innerHTML = '';
      }
    });

    this.editorBody.addEventListener('blur', () => {
      if (this.editorBody.innerHTML.trim() === '') {
        this.setContent('');
      }
    });
  }

  getContent() {
    return this.editorBody.innerHTML;
  }

  setContent(html) {
    if (!html || html.trim() === '') {
      this.editorBody.innerHTML = `<p style="color: var(--text-muted);">${this.placeholder}</p>`;
    } else {
      this.editorBody.innerHTML = html;
      
      // Adjust checklist line-through styles on load
      this.editorBody.querySelectorAll('input[type=checkbox]').forEach(cb => {
        if (cb.checked) {
          cb.nextElementSibling.style.textDecoration = 'line-through';
          cb.nextElementSibling.style.opacity = '0.5';
        }
      });
    }
  }

  setReadOnly(isReadOnly) {
    this.editorBody.setAttribute('contenteditable', String(!isReadOnly));
  }

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  exportPdf() {
    const noteTitle = document.getElementById('active-note-title').value.trim() || 'Untitled Note';
    const content = this.getContent();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Please allow popups to export PDFs.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${noteTitle}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              padding: 40px;
              background: #fff;
              line-height: 1.6;
            }
            h1, h2, h3 {
              font-family: 'Outfit', sans-serif;
              color: #1e1b4b;
            }
            h1 {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              font-size: 28px;
              margin-bottom: 24px;
            }
            img {
              max-width: 100%;
              border-radius: 8px;
              margin: 15px 0;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            td, th {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
            }
            th {
              background-color: #f1f5f9;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <h1>${noteTitle}</h1>
          <div class="meta">Exported from StudySync on ${new Date().toLocaleDateString()}</div>
          <div>${content}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
