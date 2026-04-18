"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Mail, Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvites, useMembers, useUserMutations } from "@/hooks/use-users";
import { ROLES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";
import { useSession } from "@/stores/session-store";

export default function UsersPage() {
  const role = useSession((s) => s.role);
  const members = useMembers();
  const invites = useInvites();
  const { invite, revoke, setRole: setMemberRole, remove } = useUserMutations();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleSel, setRoleSel] = useState<UserRole>("cashier");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (role !== "owner") {
    return <Empty title="Owners only" description="Only business owners can manage users." />;
  }

  async function submitInvite() {
    setErr(null);
    setSaving(true);
    try {
      if (!email.includes("@")) throw new Error("Enter a valid email.");
      await invite(email, roleSel);
      setEmail("");
      setInviteOpen(false);
      await invites.refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users &amp; Roles</h1>
          <p className="text-sm text-muted-foreground">
            Invite staff, assign roles, and manage access to this business.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-1 h-4 w-4" />
          Invite user
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.loading ? (
            <Skeleton className="h-32 w-full" />
          ) : !members.data?.length ? (
            <Empty title="No members yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={m.role}
                        onValueChange={async (v) => {
                          await setMemberRole(m.id, v as UserRole);
                          await members.refetch();
                        }}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(m.created_at), "PP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm(`Remove ${m.full_name ?? "member"}?`)) return;
                          await remove(m.id);
                          await members.refetch();
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invites</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : !invites.data?.length ? (
            <Empty title="No pending invites" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.data.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Mail className="mr-1 inline h-3.5 w-3.5" />
                      {i.email}
                    </TableCell>
                    <TableCell className="capitalize">{i.role}</TableCell>
                    <TableCell>
                      <Badge variant={i.status === "pending" ? "default" : "outline"}>
                        {i.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(i.token)}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        copy
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {i.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await revoke(i.id);
                            await invites.refetch();
                          }}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              The invitee must sign up with this email, then accept the invite token on /setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleSel} onValueChange={(v) => setRoleSel(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span>{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitInvite} disabled={saving}>
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
