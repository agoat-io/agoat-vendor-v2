package templates

import (
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// Engine handles template rendering with Liquid syntax support
type Engine struct {
	templatesDir string
	templates    map[string]*template.Template
	funcMap      template.FuncMap
}

// NewEngine creates a new template engine
func NewEngine(templatesDir string) *Engine {
	engine := &Engine{
		templatesDir: templatesDir,
		templates:    make(map[string]*template.Template),
		funcMap: template.FuncMap{
			"formatDate": func(date interface{}) string {
				if date == nil {
					return ""
				}
				// Simple date formatting - you can enhance this
				return fmt.Sprintf("%v", date)
			},
			"truncate": func(text string, length int) string {
				if len(text) <= length {
					return text
				}
				return text[:length] + "..."
			},
			"markdown": func(text string) template.HTML {
				// Simple markdown to HTML conversion
				// You can enhance this with a proper markdown parser
				html := strings.ReplaceAll(text, "\n", "<br>")
				html = strings.ReplaceAll(html, "**", "<strong>")
				html = strings.ReplaceAll(html, "*", "<em>")
				return template.HTML(html)
			},
		},
	}

	// Template functions are already defined in funcMap above

	// Load templates immediately
	engine.LoadTemplates()

	return engine
}

// LoadTemplates loads all templates from the templates directory
func (e *Engine) LoadTemplates() error {
	return filepath.WalkDir(e.templatesDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() || !strings.HasSuffix(path, ".liquid") {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read template %s: %v", path, err)
		}

		// Convert Liquid syntax to Go template syntax
		goTemplate := e.convertLiquidToGoTemplate(string(content))

		// Parse the template
		tmpl, err := template.New(filepath.Base(path)).Funcs(e.funcMap).Parse(goTemplate)
		if err != nil {
			return fmt.Errorf("failed to parse template %s: %v", path, err)
		}

		// Store the template with a key based on the filename
		key := strings.TrimSuffix(filepath.Base(path), ".liquid")
		e.templates[key] = tmpl

		return nil
	})
}

// Render renders a template with the given data
func (e *Engine) Render(w io.Writer, templateName string, data interface{}) error {
	tmpl, exists := e.templates[templateName]
	if !exists {
		return fmt.Errorf("template %s not found", templateName)
	}

	return tmpl.Execute(w, data)
}

// RenderLiquid renders a template using Liquid syntax
func (e *Engine) RenderLiquid(w io.Writer, templateName string, data interface{}) error {
	tmpl, exists := e.templates[templateName]
	if !exists {
		return fmt.Errorf("template %s not found", templateName)
	}

	// Render with Go template directly to response
	return tmpl.Execute(w, data)
}

// convertLiquidToGoTemplate converts Liquid syntax to Go template syntax
func (e *Engine) convertLiquidToGoTemplate(content string) string {
	// Basic Liquid to Go template conversions
	conversions := map[string]string{
		"{{":                    "{{",
		"}}":                    "}}",
		"{%":                    "{{",
		"%}":                    "}}",
		"{% if":                 "{{if",
		"{% endif":              "{{end}}",
		"{% for":                "{{range",
		"{% endfor":             "{{end}}",
		"{% assign":             "{{$",
		"{% capture":            "{{$",
		"{% endcapture":         "}}",
		"{{ page.title }}":      "{{.Title}}",
		"{{ page.content }}":    "{{.Content}}",
		"{{ page.author }}":     "{{.Author}}",
		"{{ page.created_at }}": "{{.CreatedAt}}",
		"{{ post.title }}":      "{{.Title}}",
		"{{ post.content }}":    "{{.Content}}",
		"{{ post.author }}":     "{{.Author}}",
		"{{ post.created_at }}": "{{.CreatedAt}}",
		"{{ user.username }}":   "{{.Username}}",
		"{{ user.email }}":      "{{.Email}}",
	}

	result := content
	for liquid, goTemplate := range conversions {
		result = strings.ReplaceAll(result, liquid, goTemplate)
	}

	return result
}

// RenderTurboStream renders a Turbo Stream response
func (e *Engine) RenderTurboStream(w io.Writer, action, target, templateName string, data interface{}) error {
	turboStream := fmt.Sprintf(`
<turbo-stream action="%s" target="%s">
  <template>
`, action, target)

	_, err := w.Write([]byte(turboStream))
	if err != nil {
		return err
	}

	// Render the template content
	err = e.Render(w, templateName, data)
	if err != nil {
		return err
	}

	// Close the turbo-stream
	_, err = w.Write([]byte(`
  </template>
</turbo-stream>
`))

	return err
}

// RenderPartial renders a partial template
func (e *Engine) RenderPartial(w io.Writer, partialName string, data interface{}) error {
	return e.Render(w, "_"+partialName, data)
}
