-- Back to plain text: the document's text nodes joined with spaces (formatting is lost).
CREATE FUNCTION pg_temp.doc_text(doc JSONB) RETURNS VARCHAR(2000) LANGUAGE SQL IMMUTABLE AS $$
  SELECT left(string_agg(value #>> '{}', ' '), 2000) FROM jsonb_path_query(doc, 'strict $.**.text') AS t(value)
$$;
ALTER TABLE "employee_reviews"
    ALTER COLUMN "feedback_hr" TYPE VARCHAR(2000) USING pg_temp.doc_text("feedback_hr"),
    ALTER COLUMN "feedback_lead" TYPE VARCHAR(2000) USING pg_temp.doc_text("feedback_lead"),
    ALTER COLUMN "feedback_team" TYPE VARCHAR(2000) USING pg_temp.doc_text("feedback_team"),
    ALTER COLUMN "feedback_client" TYPE VARCHAR(2000) USING pg_temp.doc_text("feedback_client");
