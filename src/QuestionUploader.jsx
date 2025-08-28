import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useAuth } from './AuthContext'
import '../styles/questionUploader.css'

const QuestionUploader = () => {
  const { authState } = useAuth()
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const handleFileChangeEvent = () => {
      setIsUploading(false)
      setStatusMessage('')
    }
    window.addEventListener('upload:file-change', handleFileChangeEvent)
    return () => window.removeEventListener('upload:file-change', handleFileChangeEvent)
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    setFile(selected)
    setStatusMessage('')
    window.dispatchEvent(new CustomEvent('upload:file-change', { detail: { file: selected } }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setIsUploading(true)
    setStatusMessage('Uploading...')
    window.dispatchEvent(new Event('upload:submit'))
    const formData = new FormData()
    formData.append('questionsFile', file)
    try {
      const res = await fetch('/.netlify/functions/uploadquestionsfunction', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMessage(data.message || 'Upload successful.')
        window.dispatchEvent(new Event('upload:success'))
      } else {
        throw new Error(data.error || 'Upload failed.')
      }
    } catch (err) {
      setStatusMessage(err.message)
      window.dispatchEvent(new Event('upload:failure'))
    } finally {
      setIsUploading(false)
    }
  }

  if (!authState.user || authState.user.role !== 'admin') {
    return null
  }

  return (
    <>
      <Helmet>
        <title>Upload Questions | IBT Prep Admin</title>
        <meta name="description" content="Administrator interface to upload TOEFL iBT practice test questions via CSV or JSON." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${window.location.origin}/admindashboard/questionuploader`} />
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/styles/sidebar.css" />
        <link rel="stylesheet" href="/styles/auth.css" />
        <link rel="stylesheet" href="/styles/questionUploader.css" />
      </Helmet>
      <a href="#uploader-main" className="skip-link">Skip to main content</a>
      <main id="uploader-main" className="uploader-page" role="main">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li><a href="/admindashboard">Dashboard</a></li>
            <li aria-current="page">Upload Questions</li>
          </ol>
        </nav>
        <header className="uploader-header">
          <h1>Upload Test Questions</h1>
          <p>Upload your questions file in CSV or JSON format to populate the database.</p>
        </header>
        <section className="uploader-section">
          <form
            id="uploader-form"
            className={`uploader-form grid cols-6 gap-4${isUploading ? ' is-uploading' : ''}`}
            onSubmit={handleSubmit}
            aria-busy={isUploading}
            data-upload-form
          >
            <div className="col-span-6">
              <label htmlFor="file-upload" className="form-label">Choose CSV or JSON file</label>
              <input
                type="file"
                id="file-upload"
                data-testid="upload-input"
                accept=".csv,application/json,text/csv"
                onChange={handleFileChange}
                aria-label="File upload input"
                required
                className="form-input"
                data-upload-input
              />
            </div>
            <div className="col-span-6 text-right">
              <button
                type="submit"
                id="upload-submit"
                disabled={!file || isUploading}
                aria-disabled={(!file || isUploading).toString()}
                className="btn btn-primary"
                data-upload-submit
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            <div className="col-span-6">
              <div
                id="upload-status"
                aria-live="polite"
                className={`upload-status${statusMessage.includes('failed') ? ' is-error' : statusMessage.includes('successful') ? ' is-success' : ''}`}
                data-upload-status
              >
                {statusMessage}
              </div>
            </div>
          </form>
        </section>
      </main>
    </>
  )
}

export default QuestionUploader