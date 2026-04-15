import React from 'react'

interface Props {
  screenName: string
  children: React.ReactNode
}

type ScreenErrorBoundaryState = {
  hasError: boolean
}

export default class ScreenErrorBoundary extends React.Component<Props, ScreenErrorBoundaryState> {
  public constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(error: Error): ScreenErrorBoundaryState {
    void error
    return { hasError: true }
  }

  public componentDidCatch(error: Error): void {
    console.error(`[${this.props.screenName}] Render error:`, error)
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false })
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-night-950 px-6">
          <div className="card w-full max-w-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-night-100">{this.props.screenName}</h2>
            <p className="mt-2 text-sm text-night-400">Er is een onverwachte fout opgetreden in dit scherm.</p>
            <div className="mt-5 flex justify-center">
              <button type="button" onClick={this.handleRetry} className="btn-primary">
                Probeer opnieuw
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
