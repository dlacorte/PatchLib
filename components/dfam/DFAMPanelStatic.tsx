'use client'

import { DFAMPanel } from './DFAMPanel'

interface Connection {
  fromJack: string
  toJack: string
  color: string
}

interface DFAMPanelStaticProps {
  values: Record<string, number>
  connections: Connection[]
}

export function DFAMPanelStatic({ values, connections }: DFAMPanelStaticProps) {
  return (
    <DFAMPanel
      values={values}
      onChange={() => {}}
      connections={connections}
      onConnectionsChange={() => {}}
    />
  )
}
