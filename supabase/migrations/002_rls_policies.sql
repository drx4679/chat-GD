-- =============================================================================
-- Migration 002 : Politiques de sécurité RLS (Row Level Security)
-- Description : Activation de RLS et définition des politiques d'accès
--               pour les 5 tables de l'application GD Shop Chat.
-- =============================================================================

-- Activation de la sécurité RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 1. Politiques pour la table PROFILES
-- =============================================================================

-- Lecture accessible à tous les utilisateurs authentifiés
CREATE POLICY "Les profils sont visibles par tous les utilisateurs connectés"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Modification limitée à son propre profil
CREATE POLICY "Un utilisateur ne peut modifier que son propre profil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 2. Politiques pour la table CONVERSATIONS
-- =============================================================================

-- Visualisation autorisée uniquement si l'utilisateur est participant
CREATE POLICY "Un utilisateur ne peut voir que les conversations dont il est participant"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- Création autorisée pour tout utilisateur authentifié
CREATE POLICY "Les utilisateurs connectés peuvent créer des conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================================================
-- 3. Politiques pour la table CONVERSATION_PARTICIPANTS
-- =============================================================================

-- Visualisation des participants si l'utilisateur fait partie de la conversation
CREATE POLICY "Un utilisateur peut voir les participants de ses conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants AS cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Insertion autorisée pour tout utilisateur authentifié (création / ajout)
CREATE POLICY "Les utilisateurs connectés peuvent ajouter des participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================================================
-- 4. Politiques pour la table MESSAGES
-- =============================================================================

-- Lecture des messages uniquement dans les conversations dont on est membre
CREATE POLICY "Un utilisateur peut lire les messages de ses conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- Envoi d'un message uniquement en son nom propre dans ses conversations
CREATE POLICY "Un utilisateur peut envoyer des messages en son nom dans ses conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- Mise à jour (pour marquer read_at) autorisée pour les membres de la conversation
CREATE POLICY "Les participants peuvent mettre à jour les messages dans leurs conversations"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- =============================================================================
-- 5. Politiques pour la table PUSH_SUBSCRIPTIONS
-- =============================================================================

-- Gestion intégrale (SELECT, INSERT, UPDATE, DELETE) limitée à ses propres abonnements
CREATE POLICY "Un utilisateur gère uniquement ses propres abonnements push"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
