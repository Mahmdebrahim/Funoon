import { Component } from 'react'
import ServerErrorPage from './ServerErrorPage'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
        return { hasError: true }
    }
    componentDidCatch(error, info) {
        console.error('App crashed:', error, info)
    }
    render() {
        return this.state.hasError ? <ServerErrorPage /> : this.props.children
    }
}