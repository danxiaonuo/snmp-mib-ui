import { render, screen } from '@testing-library/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card with children', () => {
      render(
        <Card data-testid="test-card">
          <div>Card content</div>
        </Card>
      )
      
      const card = screen.getByTestId('test-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Card content')
    })

    it('applies custom className', () => {
      render(
        <Card className="custom-class" data-testid="test-card">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('test-card')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('CardHeader', () => {
    it('renders header with title and description', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })
  })

  describe('CardContent', () => {
    it('renders content area', () => {
      render(
        <Card>
          <CardContent>
            <p>Card content area</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Card content area')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('renders as h3 by default', () => {
      render(<CardTitle>Test Title</CardTitle>)
      
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Test Title')
    })
  })

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(<CardDescription>Test description</CardDescription>)
      
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('has correct styling classes', () => {
      render(<CardDescription data-testid="description">Test</CardDescription>)
      
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })
})