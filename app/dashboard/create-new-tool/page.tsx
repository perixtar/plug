'use client'

import { createTool } from '@/app/actions/tool/create-tool'
import { useWorkspaceStore, WorkspaceState } from '@/app/store/workspace-store'
import type { DatabaseConfig } from '@/components/database-configs'
import { DatabaseConfigSummary } from '@/components/database-configs/database-config-summary'
import { FirestoreConfig } from '@/components/database-configs/firestore-config'
import { MongoDBConfig } from '@/components/database-configs/mongodb-config'
import { MySQLConfig } from '@/components/database-configs/mysql-config'
// Import the database config components directly
import { PostgresConfig } from '@/components/database-configs/postgres-config'
import { SupabaseConfig } from '@/components/database-configs/supabase-config'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DbType } from '@/types/database-type'
import { IconName } from '@/types/icon-name'
import { Slash } from 'lucide-react'
import { Check, Database, Server, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

export default function CreateNewToolPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [toolName, setProjectName] = useState('')
  const [toolDescript, setProjectDescript] = useState('')
  const [selectedDatabase, setSelectedDatabase] = useState('')
  const [selectedDatabaseType, setSelectedDatabaseType] = useState('')
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig | null>(
    null,
  )
  const [isNewDatabase, setIsNewDatabase] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnsupportedOpen, setUnsupportedOpen] = useState(false)
  const [unsupportedDb, setUnsupportedDb] = useState<string | null>(null)
  const dbLabel: Record<string, string> = {
    postgres: 'PostgreSQL',
    mongodb: 'MongoDB',
    mysql: 'MySQL',
    supabase: 'Supabase',
  }
  const { current_workspace_id, workspace_to_wsdb } = useWorkspaceStore(
    useShallow((state: WorkspaceState) => ({
      current_workspace_id: state.current_workspace_id,
      workspace_to_wsdb: state.workspace_to_wsdb,
    })),
  )
  const existingDatabases =
    current_workspace_id && workspace_to_wsdb
      ? (workspace_to_wsdb[current_workspace_id] ?? [])
      : []

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value)
  }
  const handleProjectDescriptChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectDescript(e.target.value)
  }

  const handleDatabaseTypeSelect = (value: string) => {
    const unsupported = ['postgres', 'mongodb', 'mysql', 'supabase']
    if (unsupported.includes(value)) {
      setUnsupportedDb(value)
      setUnsupportedOpen(true)
      // Do not update selectedDatabaseType so the UI doesn't proceed
      return
    }
    setSelectedDatabaseType(value)
    setConnectionTested(false)
    setDatabaseConfig(null)
  }

  const handleConnectionTested = (success: boolean, config: any) => {
    if (success) {
      setConnectionTested(true)
      setDatabaseConfig({
        type: selectedDatabaseType as any,
        config,
      })
    } else {
      setConnectionTested(false)
    }
  }

  const handleDatabaseSelection = (value: string) => {
    setIsNewDatabase(value === 'add-new-database')
    setSelectedDatabase(value)
  }

  const nextStep = async () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleCreateTool = async () => {
    setIsSubmitting(true)
    if (!current_workspace_id) {
      console.log('ERROR current_workspace_id not found')
      return
    }

    const dbConfig =
      selectedDatabaseType == DbType.None
        ? ({
            type: DbType.None,
            config: null,
          } as DatabaseConfig)
        : databaseConfig
    if (isNewDatabase && !dbConfig) {
      // should never happen given we validate db config in the previous step
      console.log('ERROR db config not found for newDatabase')
      return
    }
    var selected_db_id = null
    if (!isNewDatabase) {
      if (!selectedDatabase) {
        return
      }
      const existingDb = existingDatabases.find(
        (db) => db.nickname === selectedDatabase,
      )
      selected_db_id = existingDb?.id || null
    }

    // 1) if selected_db_id, then we reuse the existing db table, else create a new workspace_db, and set the id for the tool
    // 2) db type is none. No db selected
    const tool_id = await createTool(
      toolName,
      toolDescript,
      dbConfig,
      current_workspace_id,
      selected_db_id,
      IconName.StickyNote,
    )

    if (!tool_id) {
      console.log('tool id not created')
      return
    }
    router.push(`/tool/${tool_id}/edit`)
  }

  const renderDatabaseConfig = () => {
    switch (selectedDatabaseType) {
      //   case 'postgres':
      //     return (
      //       <PostgresConfig
      //         onConnectionTested={handleConnectionTested}
      //         existingDatabases={existingDatabases}
      //       />
      //     )
      //   case 'mongodb':
      //     return (
      //       <MongoDBConfig
      //         onConnectionTested={handleConnectionTested}
      //         existingDatabases={existingDatabases}
      //       />
      //     )
      //   case 'mysql':
      //     return (
      //       <MySQLConfig
      //         onConnectionTested={handleConnectionTested}
      //         existingDatabases={existingDatabases}
      //       />
      //     )
      //   case 'supabase':
      //     return (
      //       <SupabaseConfig
      //         onConnectionTested={handleConnectionTested}
      //         existingDatabases={existingDatabases}
      //       />
      //     )
      case 'firestore':
        return (
          <FirestoreConfig
            onConnectionTested={handleConnectionTested}
            existingDatabases={existingDatabases}
          />
        )
      default:
        return null
    }
  }
  const dbSelectionStepCheck = () => {
    if (isNewDatabase) {
      return (
        (selectedDatabaseType && connectionTested) ||
        selectedDatabaseType === DbType.None
      )
    } else {
      return selectedDatabase != ''
    }
  }

  return (
    <>
      <div className="px-6 py-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Create New Tool</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex-1 p-4 pt-0 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 mt-3">
            <div className="relative">
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted/60"></div>
              <ol className="relative z-10 flex w-full justify-between">
                <li className="flex items-center justify-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-medium transition-colors shadow-sm ring-1 ring-border ${
                      step >= 1
                        ? 'border-primary bg-gradient-to-r from-primary to-primary/80 text-primary-foreground ring-primary/30 shadow'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {step > 1 ? <Check className="h-4 w-4" /> : 1}
                  </div>
                </li>
                <li className="flex items-center justify-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-medium transition-colors shadow-sm ring-1 ring-border ${
                      step >= 2
                        ? 'border-primary bg-gradient-to-r from-primary to-primary/80 text-primary-foreground ring-primary/30 shadow'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {step > 2 ? <Check className="h-4 w-4" /> : 2}
                  </div>
                </li>
                <li className="flex items-center justify-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-medium transition-colors shadow-sm ring-1 ring-border ${
                      step >= 3
                        ? 'border-primary bg-gradient-to-r from-primary to-primary/80 text-primary-foreground ring-primary/30 shadow'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {step > 3 ? <Check className="h-4 w-4" /> : 3}
                  </div>
                </li>
              </ol>
            </div>
            <div className="mt-3 grid grid-cols-3 text-[11px] md:text-xs font-medium text-muted-foreground">
              <div className="text-left uppercase tracking-wide">
                Project Name
              </div>
              <div className="text-center uppercase tracking-wide">
                Database
              </div>
              <div className="text-right uppercase tracking-wide">Review</div>
            </div>
          </div>

          <Card className="border-border/60 shadow-sm supports-[backdrop-filter]:bg-background/70">
            <CardHeader className="space-y-1 border-b pb-4">
              <CardTitle className="text-xl md:text-2xl">
                {step === 1 && 'Name Your Project'}
                {step === 2 && 'Choose a Database'}
                {step === 3 && 'Review Your Configuration'}
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                {step === 1 &&
                  'Give your new tool a name that describes its purpose.'}
                {step === 2 &&
                  'Select a database and configure connection details.'}
                {step === 3 &&
                  'Review your configuration before creating your tool.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-5">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="toolName" className="text-sm font-medium">
                      Project Name
                    </Label>
                    <Input
                      id="toolName"
                      name="toolName"
                      value={toolName}
                      onChange={handleProjectNameChange}
                      placeholder="Enter project name"
                      className="h-11 text-base"
                    />
                  </div>

                  {/* Project Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="toolDescription"
                      className="text-sm font-medium"
                    >
                      Description (Optional)
                    </Label>
                    <Input
                      id="toolDescription"
                      name="toolDescription "
                      value={toolDescript}
                      onChange={handleProjectDescriptChange}
                      placeholder="Describe what the project does"
                      className="h-11 text-base"
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="database-select"
                      className="text-sm font-medium"
                    >
                      Database Selection
                    </Label>
                    <Select
                      value={selectedDatabase}
                      onValueChange={handleDatabaseSelection}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select an existing database or create new" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingDatabases.map((db) => (
                          <SelectItem key={db.id} value={db.nickname}>
                            {db.nickname} ({db.db_type})
                          </SelectItem>
                        ))}
                        <SelectItem value="add-new-database">
                          + Add New Database
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isNewDatabase && (
                    <div className="space-y-6">
                      <RadioGroup
                        value={selectedDatabaseType}
                        onValueChange={handleDatabaseTypeSelect}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* <div>
                            <RadioGroupItem
                              value="postgres"
                              id="postgres"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="postgres"
                              className="group relative flex flex-col items-center justify-between rounded-xl border bg-popover p-5 transition-all hover:shadow-md hover:bg-accent/50 hover:text-accent-foreground border-muted ring-1 ring-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-primary/40 [&:has([data-state=checked])]:border-primary"
                            >
                              <Database className="mb-3 h-6 w-6" />
                              <div className="font-semibold">PostgreSQL</div>
                              <div className="text-sm text-muted-foreground">
                                Relational database
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="mongodb"
                              id="mongodb"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="mongodb"
                              className="group relative flex flex-col items-center justify-between rounded-xl border bg-popover p-5 transition-all hover:shadow-md hover:bg-accent/50 hover:text-accent-foreground border-muted ring-1 ring-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-primary/40 [&:has([data-state=checked])]:border-primary"
                            >
                              <Server className="mb-3 h-6 w-6" />
                              <div className="font-semibold">MongoDB</div>
                              <div className="text-sm text-muted-foreground">
                                NoSQL database
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="mysql"
                              id="mysql"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="mysql"
                              className="group relative flex flex-col items-center justify-between rounded-xl border bg-popover p-5 transition-all hover:shadow-md hover:bg-accent/50 hover:text-accent-foreground border-muted ring-1 ring-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-primary/40 [&:has([data-state=checked])]:border-primary"
                            >
                              <Database className="mb-3 h-6 w-6" />
                              <div className="font-semibold">MySQL</div>
                              <div className="text-sm text-muted-foreground">
                                Relational database
                              </div>
                            </Label>
                          </div> */}

                          <div>
                            <RadioGroupItem
                              value="firestore"
                              id="firestore"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="firestore"
                              className="group relative flex flex-col items-center justify-between rounded-xl border bg-popover p-5 transition-all hover:shadow-md hover:bg-accent/50 hover:text-accent-foreground border-muted ring-1 ring-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-primary/40 [&:has([data-state=checked])]:border-primary"
                            >
                              <Flame className="mb-3 h-6 w-6" />
                              <div className="font-semibold">Firestore</div>
                              <div className="text-sm text-muted-foreground">
                                Firebase document database
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="none"
                              id="none"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="none"
                              className="group relative flex flex-col items-center justify-between rounded-xl border bg-popover p-5 transition-all hover:shadow-md hover:bg-accent/50 hover:text-accent-foreground border-muted ring-1 ring-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-primary/40 [&:has([data-state=checked])]:border-primary"
                            >
                              <Slash className="mb-3 h-6 w-6" />
                              <div className="font-semibold">No Database</div>
                              <div className="text-sm text-muted-foreground">
                                Skip database setup
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="supabase"
                              id="supabase"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="supabase"
                              className="group relative flex flex-col items-center justify-between rounded-xl border bg-popover p-5 transition-all hover:shadow-md hover:bg-accent/50 hover:text-accent-foreground border-muted ring-1 ring-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-primary/40 [&:has([data-state=checked])]:border-primary"
                            >
                              <Database className="mb-3 h-6 w-6" />
                              <div className="font-semibold">
                                Supabase (Coming soon)
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Postgres with extras
                              </div>
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                      {/* Render the selected database configuration component */}
                      {selectedDatabaseType && renderDatabaseConfig()}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dashed p-6 bg-muted/30">
                    <h3 className="text-base font-medium mb-4">
                      Project Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Project Name
                        </h3>
                        <p className="mt-1 font-medium break-words">
                          {toolName}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Project Description
                        </h3>
                        <p className="mt-1 font-medium break-words">
                          {toolDescript}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Database
                        </h3>
                        <p className="mt-1 font-medium capitalize">
                          {isNewDatabase
                            ? selectedDatabaseType
                            : selectedDatabase}
                        </p>
                      </div>

                      {/* Database configuration summary */}
                      <DatabaseConfigSummary databaseConfig={databaseConfig} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-3 border-t pt-4">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="px-6 rounded-xl shadow-sm"
                >
                  Previous
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="px-6 rounded-xl shadow-sm"
                >
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !toolName) ||
                    (step === 2 && !dbSelectionStepCheck())
                  }
                  className="px-6 rounded-xl shadow-sm"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleCreateTool}
                  disabled={isSubmitting}
                  className="px-6 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Tool'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      <AlertDialog open={isUnsupportedOpen} onOpenChange={setUnsupportedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {' '}
              {`${unsupportedDb ? dbLabel[unsupportedDb] : 'This database'} coming soon`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`${unsupportedDb ? dbLabel[unsupportedDb] : 'This database'} is not supported yet. We’re actively working on it and will release support soon`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction autoFocus>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
