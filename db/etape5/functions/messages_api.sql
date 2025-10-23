-- functions/messages_api.sql — API SQL pour threads/participants/messages

CREATE OR REPLACE FUNCTION messages.create_thread(p_project_id INT, p_title TEXT DEFAULT NULL)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE v_id BIGINT;
BEGIN
  INSERT INTO messages.threads(project_id, title) VALUES (p_project_id, p_title)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION messages.add_participant(p_thread_id BIGINT, p_kind TEXT, p_ref TEXT)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE v_id BIGINT;
BEGIN
  INSERT INTO messages.participants(thread_id, kind, ref)
  VALUES (p_thread_id, p_kind, p_ref)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION messages.post(p_thread_id BIGINT, p_author_kind TEXT, p_author_ref TEXT, p_content JSONB)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE v_id BIGINT;
BEGIN
  INSERT INTO messages.messages(thread_id, author_kind, author_ref, content)
  VALUES (p_thread_id, p_author_kind, p_author_ref, p_content)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
